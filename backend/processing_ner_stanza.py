import json
from typing import Generator

import stanza
from processing_ai import get_highlight, ifg_rules
from pymupdf import Document
from langdetect import detect

rule_pii = [r for r in ifg_rules if r["title"] == "Personenbezogene Daten"][0]

def _load_pipeline(lang: str) -> stanza.Pipeline:
    try:
        # Disable sentence splitting to align indices with original text
        return stanza.Pipeline(lang=lang, processors="tokenize,ner", tokenize_no_ssplit=True, use_gpu=False)
    except Exception:
        stanza.download(lang)
        return stanza.Pipeline(lang=lang, processors="tokenize,ner", tokenize_no_ssplit=True, use_gpu=False)

pipelines = {}

def process_pdf_streaming(doc: Document, prompt: str) -> Generator:
    lang = detect(" ".join(page.get_text() for page in doc))
    if lang not in pipelines:
        pipelines[lang] = _load_pipeline(lang)

    def generate():
        yield 'data: {"status": "started"}\n\n'
        for page in doc:
            text = page.get_text()
            for ent in pipelines[lang](text).ents:
                if ent.type in ["PER"]:
                    context = text[max(0, ent.start_char - 10) : min(len(text), ent.end_char + 10)]
                    highlight = get_highlight(page, ent.text, rule_pii, context=context)
                    if highlight:
                        yield f"data: {json.dumps(highlight)}\n\n"
        yield 'data: {"status": "completed"}\n\n'

    return generate 