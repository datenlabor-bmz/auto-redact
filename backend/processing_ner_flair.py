import json
from typing import Generator

import flair
import torch
from flair.data import Sentence
from flair.models import SequenceTagger
from langdetect import detect
from processing_ai import get_highlight, ifg_rules
from pymupdf import Document

if torch.backends.mps.is_available():
    flair.device = torch.device("mps")
elif torch.cuda.is_available():
    flair.device = torch.device("cuda")
else:
    flair.device = torch.device("cpu")

_models = {
    "de": "flair/ner-german-large",
    "en": "flair/ner-english-large",
}

_taggers: dict[str, SequenceTagger] = {}

rule_pii = next(r for r in ifg_rules if r["title"] == "Personenbezogene Daten")


def _load_tagger(lang: str) -> SequenceTagger:
    """Load (and cache) a Flair NER tagger for the given language."""
    if lang not in _taggers:
        model_name = _models.get(lang, _models["en"])
        _taggers[lang] = SequenceTagger.load(model_name)
    return _taggers[lang]


def process_pdf_streaming(doc: Document, prompt: str) -> Generator:
    """Generator producing SSE events for NER redaction suggestions using Flair."""

    lang = detect(" ".join(page.get_text() for page in doc))
    if lang not in _models:
        lang = "en"  # default fallback
    tagger = _load_tagger(lang)

    def generate():
        yield 'data: {"status": "started"}\n\n'
        for page in doc:
            text = page.get_text()
            sentence = Sentence(text, use_tokenizer=False)
            tagger.predict(sentence)
            for span in sentence.get_spans("ner"):
                if span.tag in ["PER"]:
                    context = text[
                        max(0, span.start_position - 10) : min(
                            len(text), span.end_position + 10
                        )
                    ]
                    highlight = get_highlight(
                        page, span.text, rule_pii, context=context
                    )
                    if highlight:
                        yield f"data: {json.dumps(highlight)}\n\n"
        yield 'data: {"status": "completed"}\n\n'

    return generate
