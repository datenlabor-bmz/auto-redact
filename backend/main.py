# See documentation of PyMuPdf:
# - https://pymupdf.readthedocs.io/en/latest/page.html#Page.add_redact_annot
# - https://pymupdf.readthedocs.io/en/latest/annot.html

import io
import json
import os
from typing import Literal
import pymupdf
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    APIRouter,
)
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import base64
from pymupdf import Document, Page, Annot
from processing import process_pdf_streaming
from typing import cast


from requests import get
print("proxy", os.getenv("HTTP_PROXY"))
print("a", get("http://example.com"))
print("b", get("http://example.com", proxies=os.getenv("HTTP_PROXY")))



app = FastAPI()
api_router = APIRouter()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api_router.post("/analyze-pdf")
def analyze_pdf(file: UploadFile, prompt: str = Form(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = file.file.read()
    pdf_stream = io.BytesIO(contents)
    doc = pymupdf.open(stream=pdf_stream, filetype="pdf")

    return StreamingResponse(
        process_pdf_streaming(doc, prompt)(), media_type="text/event-stream"
    )


def safe_filename(filename: str) -> str:
    safe_chars = set(" ()-_.,![]{}#@%+=")  # Common safe special characters
    return "".join(
        c if (c.isalnum() or c in safe_chars) else "_" for c in filename
    ).strip()


@api_router.post("/upload-pdf")
def upload_pdf(file: UploadFile = File(...)):
    """
    Converts redaction annotations to highlights for the frontend.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    # Read the PDF file
    contents = file.file.read()
    pdf_stream = io.BytesIO(contents)
    doc = pymupdf.open(stream=pdf_stream, filetype="pdf")

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

    # Convert PDF to base64 for JSON response
    pdf_bytes = doc.tobytes(garbage=1)
    pdf_base64 = base64.b64encode(pdf_bytes).decode("ascii")

    return Response(
        content=json.dumps(
            {
                "pdf": pdf_base64,
                "highlights": highlights,
            }
        ),
        media_type="application/json",
    )


@api_router.post("/download-pdf")
def download_pdf(
    file: UploadFile = File(...),
    annotations: str = Form(...),
    mode: Literal["draft", "final"] = Form("final"),
):
    """
    Converts highlights from the frontend to (draft/final) redaction annotations.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    # Parse the annotations JSON string
    highlights = json.loads(annotations)

    # Read the PDF file
    contents = file.file.read()
    pdf_stream = io.BytesIO(contents)
    doc = pymupdf.open(stream=pdf_stream, filetype="pdf")
    doc = cast(Document, doc)

    # Process each highlight
    for highlight in highlights:
        page = doc[highlight["position"]["pageNumber"] - 1]  # 0-based index
        page = cast(Page, page)
        rect = highlight["position"]["boundingRect"]
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
            text=short_text,
            cross_out=False,
            fill=pink,
        )
        annot.set_info(content=long_text, subject=highlight["content"]["text"])
        # There's some arguments for using other kinds of annotations such as highlight_annot for drafts, because they are displayed better in some viewers such as Apple Preview; but for the sake of standardization, we stick with redact_annot.
        if mode == "final":
            page.apply_redactions()  # This is also done by `scrub` below, but `scrub` gets into errors with redaction annotations, so we already apply them here.

    if mode == "final":
        doc.scrub(redact_images=1)  # remove metadata, embeddeded files, comments, etc.
        doc.set_metadata({"producer": "AutoRedact"})
        # we want to see how often our tool will be used :)

    filename, ext = os.path.splitext(safe_filename(file.filename))
    filename = (
        f"{filename}{'_redaction_draft' if mode == 'draft' else '_redacted'}{ext}"
    )

    return Response(
        content=doc.tobytes(garbage=1),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# Include the router with prefix
app.include_router(api_router, prefix="/api")

# Only mount static files if the directory exists (production mode)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
