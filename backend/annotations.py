from typing import Literal, cast

from pymupdf import Annot, Document, Page

def convert_annotations_to_highlights(doc: Document) -> list[dict]:
    """
    Converts redaction annotations to highlights for the frontend.
    """
    highlights = []
    if doc.has_annots():
        for page in doc:
            for annot in page.annots():
                if annot.type[0] == 12:
                    rect = {
                        "x1": annot.rect[0],
                        "y1": annot.rect[1],
                        "x2": annot.rect[2],
                        "y2": annot.rect[3],
                    }
                    rect = {
                        **rect,
                        "height": page.rect.height,
                        "width": page.rect.width,
                        "pageNumber": page.number + 1,
                    }
                    highlight = {
                        "position": {
                            "pageNumber": page.number + 1,
                            "boundingRect": rect,
                            "rects": [rect],
                        },
                        "content": {"text": annot.info.get("subject", "")},
                        "comment": {"text": "", "emoji": ""},
                        "id": hash(annot),
                    }
                    if comment := annot.info.get("content"):
                        reference, title, rest = comment.split("\n\n", 2)
                        full_text, url = rest.rsplit("\n\n", 1)
                        highlight["ifgRule"] = {
                            "reference": reference,
                            "title": title,
                            "full_text": full_text,
                            "url": url,
                        }
                    highlights.append(highlight)
                    page.delete_annot(annot)
    return highlights

def apply_annotations(doc: Document, highlights: list[dict], mode: Literal["draft", "final"]):
    """
    Applies redaction annotations to a document, either in draft (yellow transparent overlay) or final mode (black (or pink) redactions).
    """
    # Process each highlight
    for highlight in highlights:
        page = doc[highlight["position"]["pageNumber"] - 1]  # 0-based index
        page = cast(Page, page)
        for i, rect in enumerate(highlight["position"]["rects"]):
            # We could also use the individual rects that make up for example a paragraph of multiple lines of different shapes, but according to https://pymupdf.readthedocs.io/en/latest/page.html#Page.add_redact_annot, "if a quad is specified, then the enveloping rectangle is taken" anyway.

            # Transform coordinates from frontend to backend

            # react-pdf-highlighter stores the coordinates in a relative format:
            # the "height" and "width" attributes of the rects give the page dimensions (surprisingly, NOT the rect dimensions),
            # and the x1, y1, x2, y2 attributes are relative to the page dimensions.
            # For PyMuPDF, we need to convert these relative coordinates to absolute coordinates.

            page_width_frontend = rect.get("width")
            page_height_frontend = rect.get("height")
            page_width_backend = page.rect.width
            page_height_backend = page.rect.height

            factor_x = page_width_backend / page_width_frontend
            factor_y = page_height_backend / page_height_frontend
            coords = [
                rect["x1"] * factor_x,
                rect["y1"] * factor_y,
                rect["x2"] * factor_x,
                rect["y2"] * factor_y,
            ]

            # Create (draft) redaction annotation
            pink = (1, 0.41, 0.71)
            ifgRule = highlight.get("ifgRule", {})
            short_text = (
                f"{ifgRule.get('title', '')}, {ifgRule.get('reference', '')}"
                if ifgRule
                else ""
            )
            long_text = (
                f"{ifgRule.get('reference', '')}\n\n{ifgRule.get('title', '')}\n\n{ifgRule.get('full_text', '')}\n\n{ifgRule.get('url', '')}"
                if ifgRule
                else ""
            )
            annot: Annot = page.add_redact_annot(
                quad=coords,
                text=short_text if i == 0 else "",
                cross_out=False,
                fill=pink,
            )
            annot.set_info(content=long_text, subject=highlight["content"]["text"])
            # There's some arguments for using other kinds of annotations such as highlight_annot for drafts, because they are displayed better in some viewers such as Apple Preview; but for the sake of standardization, we stick with redact_annot.
        if mode == "final":
            page.apply_redactions()  # This is also done by `scrub` below, but `scrub` gets into errors with redaction annotations, so we already apply them here.

    if mode == "final":
        # remove metadata, embeddeded files, comments, etc.
        # `reset_responses` is currently deactivated because it often causes a bug
        doc.scrub(redact_images=1, reset_responses=False)
        doc.set_metadata({"producer": "AutoRedact"})
        # we want to see how often our tool will be used :)
    return doc
