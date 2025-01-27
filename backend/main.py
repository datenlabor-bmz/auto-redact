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
                print(annot.type)
                if annot.type[0] == 12 or True:
                    print(annot.rect)
                    rect = {
                        "x1": annot.rect[0],
                        "y1": annot.rect[1],
                        "x2": annot.rect[2],
                        "y2": annot.rect[3],
                    }
                    highlight = {
                        "position": {
                            "pageNumber": page.number,
                            "boundingRect": rect,
                            "rects": [
                                {
                                    **rect,
                                    "height": rect["y2"] - rect["y1"],
                                    "width": rect["x2"] - rect["x1"],
                                    "pageNumber": page.number,
                                }
                            ],
                        },
                        "content": {"text": annot.info.get("subject", "")},
                        "id": hash(annot),
                        # "ifgRule": None, # annot.info.get("content", {}),
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

        # # Print page dimensions from API call
        # print(
        #     f"API dimensions - Width: {rect.get('width', 'N/A')}, Height: {rect.get('height', 'N/A')}"
        # )

        # # Print page dimensions from PyMuPDF
        # page_rect = page.rect
        # print(
        #     f"PyMuPDF dimensions - Width: {page_rect.width}, Height: {page_rect.height}"
        # )
        A4_WIDTH = 595
        A4_HEIGHT = 842
        factor_x = A4_WIDTH / rect["width"]
        factor_y = A4_HEIGHT / rect["height"]
        print(f"Factor x: {factor_x}, Factor y: {factor_y}")

        coords = [
            rect["x1"] * factor_x,
            rect["y1"] * factor_y,
            rect["x2"] * factor_x,
            rect["y2"] * factor_y,
        ]
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
        doc.scrub(redact_images=1)
        doc.set_metadata({"producer": "AutoRedact"})

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
