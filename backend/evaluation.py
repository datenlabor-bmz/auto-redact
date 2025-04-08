import difflib

import pymupdf
from processing import ifg_text, process_pdf
from pymupdf import Document


def copy_doc(doc: Document) -> Document:
    # make a deep copy of the document
    # see https://github.com/pymupdf/PyMuPDF/discussions/2569
    return pymupdf.open("pdf", doc.tobytes())


def read_redactions_from_pdf(doc: Document) -> list[str]:
    doc = copy_doc(
        doc
    )  # make a deep copy because later we will modify the redaction comments
    unredacted_text = "\n\n".join([page.get_text() for page in doc])
    for page in doc:
        for annot in page.annots():
            if annot.type[0] == 12:
                # replace annot with annot without text
                # this modifies the document in place
                coords = annot.rect
                page.delete_annot(annot)
                page.add_redact_annot(quad=coords, text=None)
        page.apply_redactions()
    redacted_text = "\n\n".join([page.get_text() for page in doc])

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
    return redactions


def simple_evaluation(true_items: list[str], pred_items: list[str]):
    true_set = set(item.strip() for item in true_items)
    pred_set = set(item.strip() for item in pred_items)

    tp = len(true_set.intersection(pred_set))
    fp = len(pred_set - true_set)
    fn = len(true_set - pred_set)

    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0

    return precision, recall, f1


def evaluate_pdf_redactions(doc: Document):
    redactions_true = read_redactions_from_pdf(doc)
    print("True redactions:", redactions_true)

    redactions_pred = process_pdf(doc, ifg_text)
    redactions_pred = [highlight["content"]["text"] for highlight in redactions_pred]
    print("Predicted redactions:", redactions_pred)

    precision, recall, f1 = simple_evaluation(redactions_true, redactions_pred)
    print("Precision:", precision)
    print("Recall:", recall)
    print("F1 score:", f1)


doc = pymupdf.open("../pdfs/draft_vermerk.pdf")
evaluate_pdf_redactions(doc)
