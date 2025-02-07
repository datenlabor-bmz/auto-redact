import re
import pymupdf
from pymupdf import Document, Page, Annot
from typing import cast
import difflib

doc = pymupdf.open("../pdfs/draft_vermerk.pdf")

unredacted_text = "\n\n".join(
    [page.get_text() for page in doc]
)
for page in doc:
    for annot in page.annots():
        if annot.type[0] == 12:
            # replace annot with annot without text
            coords = annot.rect
            page.delete_annot(annot)
            page.add_redact_annot(quad=coords, text=None)
    page.apply_redactions()
redacted_text = "\n\n".join(
    [page.get_text() for page in doc]
)

def is_junk(element: str) -> bool:
    return element in []

matcher = difflib.SequenceMatcher(is_junk, unredacted_text, redacted_text)

redactions = []
for tag, i1, i2, j1, j2 in matcher.get_opcodes():
    assert tag in ["equal", "delete", "replace"]
    if tag == "delete" or tag == "replace":
        if tag == "replace":
            assert redacted_text[j1:j2].strip() == ""
        redactions.append(unredacted_text[i1:i2].strip().replace("\n", " "))

print(redactions)