import json
from typing import Generator

import spacy
from processing_ai import get_highlight, ifg_rules
from pymupdf import Document
from langdetect import detect

tags = {
    "de": ["PER"],
    "en": ["PERSON"],
}
rule_pii = [a for a in ifg_rules if a["title"] == "Personenbezogene Daten"][0]

def load_model(lang: str) -> spacy.Language:
    model = {
        "de": "de_core_news_lg",
        "en": "en_core_web_lg",
    }[lang]
    try:
        return spacy.load(model)
    except Exception:
        spacy.download(model)
        return spacy.load(model)

models = {}

def process_pdf_streaming(doc: Document, prompt: str) -> Generator:
    lang = detect(" ".join(page.get_text() for page in doc))
    if lang not in models:
        models[lang] = load_model(lang)
    def generate():
        yield 'data: {"status": "started"}\n\n'
        for page in doc:
            text = page.get_text()
            for ent in models[lang](text).ents:
                if ent.label_ in tags[lang]:
                    text = text[: ent.start_char] + ent.label_ + text[ent.end_char :]
                    context = page.get_text()[
                        max(0, ent.start_char - 10) : min(
                            len(page.get_text()), ent.end_char + 10
                        )
                    ]
                    highlight = get_highlight(page, ent.text, rule_pii, context=context)
                    if highlight:
                        yield f"data: {json.dumps(highlight)}\n\n"
        yield 'data: {"status": "completed"}\n\n'

    return generate
