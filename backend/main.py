# See documentation of PyMuPdf:
# - https://pymupdf.readthedocs.io/en/latest/page.html#Page.add_redact_annot
# - https://pymupdf.readthedocs.io/en/latest/annot.html

import base64
import io
import json
import os
from typing import Literal, cast

import pymupdf
from fastapi import (
    APIRouter,
    FastAPI,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
# from processing_ai import process_pdf_streaming
from processing_ner_stanza import process_pdf_streaming
from annotations import apply_annotations, convert_annotations_to_highlights
from pymupdf import Document

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

    # Convert annotations to highlights for the frontend
    highlights = convert_annotations_to_highlights(doc)

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

    # Convert annotations to (draft) redactions
    apply_annotations(doc, highlights, mode)

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
