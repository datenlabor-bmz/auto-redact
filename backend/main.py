# See documentation of PyMuPdf: https://pymupdf.readthedocs.io/en/latest/page.html#Page.add_redact_annot

import io
import json
import os
from textwrap import dedent

import pymupdf
from dotenv import load_dotenv
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
from litellm import completion

load_dotenv(override=True)

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


def process_pdf_streaming(doc, prompt):
    # Collect all pages with page numbers
    all_pages_text = []
    for page_num, page in enumerate(doc, 1):
        page_text = page.get_text()
        all_pages_text.append(f"=== PAGE {page_num} ===\n{page_text}")

    combined_text = "\n\n".join(all_pages_text)

    full_prompt = dedent(f"""
    You are a document redaction bot. Follow this exact process:

    At the start of the document and each new page:
    THINK: Analyze the overall content, identify patterns and types of sensitive information present.
    Make high-level decisions based on concrete examples you see.

    For each potentially sensitive item:
    1. CONSIDER: Quote the sensitive phrase with its surrounding context: "..."
    2. ANALYZE: Explain why this information might need protection
    3. REDACT: "..." (optional, exact characters to be redacted)
       You can have 0, 1, or multiple REDACT commands after each analysis

    When moving to a new page:
    PAGE: Specify the new page number

    Important:
    - REDACT must use exact character matches (500000 ≠ 500.000 €)
    - Specify PAGE only when switching to a different page
    - Each REDACT must follow a CONSIDER and ANALYZE
                         
    The following is an example for generically redacting sensitive information.
    The user may ask you to redact different types of information, so you must be flexible.

    ===== EXAMPLE START =====

    THINK: After reviewing the entire document, I observe this appears to be a financial report 
    containing sensitive information across multiple pages. The document contains:
    1. Employee personal data (emails, phone numbers, IDs)
    2. Internal financial information
    3. Project codes and identifiers
    4. Performance metrics
    The redaction strategy should protect individual privacy while maintaining transparency 
    for public-facing information.

    PAGE: 1

    THINK: On this first page, I notice it contains primarily employee contact details 
    and departmental budget information. Key patterns include:
    1. Personal email addresses and phone numbers
    2. Department-level financial figures
    3. Public contact information that should be preserved

    CONSIDER: "For inquiries, contact our support team at support@company.com or visit www.company.com"
    ANALYZE: These are public-facing contact methods intended for customer communication
    
    CONSIDER: "Project lead: Sarah Chen (sarah.chen@company.com), Direct: +1-555-0123"
    ANALYZE: This contains personal contact information of an employee
    REDACT: "sarah.chen@company.com"
    REDACT: "+1-555-0123"

    CONSIDER: "Department budget allocation: $1,500,000"
    ANALYZE: This is high-level financial information that should be public for transparency

    PAGE: 2

    THINK: This page focuses on employee performance data and project details. Key patterns include:
    1. Employee IDs followed by salary figures
    2. Project codes in format PRJ-####
    3. Performance review scores

    CONSIDER: "Employee ID: A123 | Annual Compensation: $95,000 | Performance: 4.5/5"
    ANALYZE: This reveals detailed personal employment information
    REDACT: "A123"
    REDACT: "$95,000"
    REDACT: "4.5/5"

    CONSIDER: "Project PRJ-5421 status: ON_TRACK | Budget remaining: $50,000"
    ANALYZE: The project code and status are internal identifiers that should be protected
    REDACT: "PRJ-5421"

    ===== EXAMPLE END =====

    Here is what the user has asked you to do:
    "{prompt}"

    Text to analyze ({doc.page_count} pages):
    {combined_text}""")

    def generate():
        yield 'data: {"status": "started"}\n\n'

        buffer = []
        current_page = None

        for chunk in completion(
            model="azure/gpt-4o-mini",
            messages=[{"role": "user", "content": full_prompt}],
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_base=os.getenv("AZURE_OPENAI_API_BASE"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            temperature=0,
            stream=True,
        ):
            if chunk.choices[0].finish_reason is not None:
                buffer.append("\n")
            else:
                buffer.append(chunk.choices[0].delta.content)
            text = "".join(buffer)

            if "\n" in text:
                lines = text.split("\n")
                buffer = [lines[-1]]

                for line in lines[:-1]:
                    line = line.strip()
                    print(line)
                    if not line:
                        continue

                    elif line.startswith("PAGE:"):
                        current_page = int(line[5:].strip())
                    elif line.startswith('REDACT: "'):
                        redact_text = line[8:].strip().strip('"')
                        if current_page and redact_text:
                            try:
                                page = doc[current_page - 1]
                                matches = page.search_for(redact_text)

                                if matches:
                                    if len(matches) > 1:
                                        print(
                                            f"Warning: Multiple matches ({len(matches)}) found for '{redact_text}' on page {current_page}"
                                        )
                                        # TODO: make a separate prompt to identify the correct match
                                    for rect in matches:
                                        page_rect = page.rect
                                        result = {
                                            "x0": rect[0],
                                            "y0": rect[1],
                                            "x1": rect[2],
                                            "y1": rect[3],
                                            "page_width": page_rect.width,
                                            "page_height": page_rect.height,
                                            "text": redact_text,
                                            "page": current_page,
                                        }
                                        yield f"data: {json.dumps(result)}\n\n"

                            except Exception as e:
                                print(f"Error processing redaction: {e}")

        yield 'data: {"status": "completed"}\n\n'

    return generate


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
