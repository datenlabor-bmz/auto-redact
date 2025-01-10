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

from processing import process_pdf_streaming

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


@api_router.post("/save-annotations")
def save_annotations(
    file: UploadFile = File(...),
    annotations: str = Form(...),
    is_draft: str = Form("false"),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    # Parse the annotations JSON string
    highlights = json.loads(annotations)
    is_draft_mode = json.loads(is_draft)

    # Read the PDF file
    contents = file.file.read()
    pdf_stream = io.BytesIO(contents)
    doc = pymupdf.open(stream=pdf_stream, filetype="pdf")

    # Process each highlight
    for highlight in highlights:
        page = doc[highlight["position"]["pageNumber"] - 1]  # 0-based index
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
        short_text = f"{ifgRule.get('title', '')}, {ifgRule.get('reference', '')}"
        long_text = f"{ifgRule.get('reference', '')}\n\n{ifgRule.get('title', '')}\n\n{ifgRule.get('full_text', '')}\n\n{ifgRule.get('url', '')}"
        annot = page.add_redact_annot(
            quad=coords,
            text=short_text,
            cross_out=False,
            fill=pink,
        )
        annot.set_info(content=long_text)
        # There's some arguments for using other kinds of annotations such as highlight_annot for drafts, because they are displayed better in some viewers such as Apple Preview; but for the sake of standardization, we stick with redact_annot.
        if not is_draft_mode:
            page.apply_redactions()

    # Save the modified PDF
    output = io.BytesIO()
    doc.save(output)
    doc.close()

    # Create a safe filename by removing problematic characters
    safe_filename = "".join(
        c for c in file.filename if c.isalnum() or c in ("-", "_", ".")
    )

    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={'redactiondraft_' if is_draft_mode else 'redacted_'}{safe_filename}"
        },
    )


# Include the router with prefix
app.include_router(api_router, prefix="/api")

# Only mount static files if the directory exists (production mode)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
