import json
import os
from textwrap import dedent
from typing import Generator

from dotenv import load_dotenv
from litellm import completion
from pymupdf import Document, Page, Rect

load_dotenv(override=True)

with open("../rules/informationsfreiheitsgesetz.json", "r", encoding="utf-8") as f:
    ifg_rules = json.load(f)["rules"]
ifg_text = "\n\n".join(
    [f"{rule['reference']}: {rule['title']}\n{rule['full_text']}" for rule in ifg_rules]
)

def rect_obj(coords, page: Page):
    return {
        "x1": coords[0],
        "y1": coords[1],
        "x2": coords[2],
        "y2": coords[3],
        "width": page.rect.width,
        "height": page.rect.height,
        "pageNumber": page.number + 1,
    }

def bounding_rect(rects: list[Rect]):
    x1 = min([rect.x0 for rect in rects])
    y1 = min([rect.y0 for rect in rects])
    x2 = max([rect.x1 for rect in rects])
    y2 = max([rect.y1 for rect in rects])
    return (x1, y1, x2, y2)

def get_highlight(page: Page, redact_text: str, ifg_rule: str, context: str | None = None):
    if context:
        context_matches = page.search_for(context)
        if len(context_matches) >= 1:
            context_rect = bounding_rect(context_matches)
            matches = page.search_for(redact_text, clip=context_rect)
        else:
            matches = page.search_for(redact_text)
    else:
        matches = page.search_for(redact_text)
    if not matches:
        print(f"Warning: No matches found for '{redact_text}' on page {page.number}")
    if matches:
        rects = [rect_obj(rect, page) for rect in matches]
        # print([page.get_textbox(match) for match in matches])
        highlight = {
            "content": {"text": redact_text},
            "comment": {"text": "", "emoji": ""},
            "id": hash(str(rects)),
            "position": {
                "boundingRect": rect_obj(bounding_rect(matches), page),
                "rects": rects,
                "pageNumber": page.number + 1,
            },
            "ifgRule": ifg_rule,
        }
        return highlight
    return None


def process_pdf_streaming(
    doc: Document, prompt: str, verbose: bool = False, model="azure/gpt-4o-mini"
) -> Generator:
    # Collect all pages with page numbers
    all_pages_text = []
    for page_num, page in enumerate(doc, 1):
        page_text = page.get_text()
        all_pages_text.append(f"=== PAGE {page_num} ===\n{page_text}")

    combined_text = "\n\n".join(all_pages_text)

    full_prompt = dedent(f"""
    <BACKGROUND>
    Informationsfreiheitsgesetz (IFG)
    {ifg_text}
    </BACKGROUND>

    <EXAMPLE>
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
    REDACT: "sarah.chen@company.com" | Personenbezogene Daten
    REDACT: "+1-555-0123" | Personenbezogene Daten

    CONSIDER: "Department budget allocation: $1,500,000"
    ANALYZE: This is high-level financial information that should be public for transparency

    PAGE: 2

    THINK: This page focuses on employee performance data and project details. Key patterns include:
    1. Employee IDs followed by salary figures
    2. Project codes in format PRJ-####
    3. Performance review scores

    CONSIDER: "Employee ID: A123 | Annual Compensation: $95,000 | Performance: 4.5/5"
    ANALYZE: This reveals detailed personal employment information
    REDACT: "A123" | Personenbezogene Daten
    REDACT: "$95,000" | Personenbezogene Daten
    REDACT: "4.5/5" | Personenbezogene Daten

    CONSIDER: "Project PRJ-5421 status: ON_TRACK | Budget remaining: $50,000"
    ANALYZE: The project code may be an internal identifier, but is not specifically sensitive. The budget refers to the ministry's budget, which is public.
    </EXAMPLE>

    <INSTRUCTIONS>
    You are a document redaction bot. Follow this exact process:

    At the start of the document and each new page:
    PAGE: Specify the page number (do not use any markdown or other formatting)
    THINK: Analyze the overall content, identify patterns and types of sensitive information present.
    Make high-level decisions based on concrete examples you see.

    For each potentially sensitive item:
    1. CONSIDER: Quote the sensitive phrase with its surrounding context: "..."
    2. ANALYZE: Explain why this information might need protection
    3. REDACT: "..." (optional, exact characters to be redacted) | reason according to IFG (exact reference to the title of the rule as specified in the background; only use the literal title, no citation or other information)
       You can have 0, 1, or multiple REDACT commands after each analysis

    When moving to a new page:
    PAGE: Specify the new page number

    Important:
    - REDACT must use exact character matches (500000 ≠ 500.000 €)
    - Specify PAGE only when switching to a different page
    - Each REDACT must follow a CONSIDER and ANALYZE
                         
    The following is an example for generically redacting sensitive information.
    The user may ask you to redact different types of information, so you must be flexible.
    </INSTRUCTIONS>
    <USER_PROMPT>
    Here is what the user has asked you to do:
    "{prompt}"
    </USER_PROMPT>
    <TEXT_TO_ANALYZE>
    Text to analyze ({doc.page_count} pages):
    {combined_text}
    </TEXT_TO_ANALYZE>
    """)

    def generate():
        yield 'data: {"status": "started"}\n\n'

        buffer = []
        current_page = None

        for chunk in completion(
            model=model,
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
                    if verbose:
                        print(line)
                    if not line:
                        continue

                    elif line.startswith("PAGE:"):
                        current_page = int(line[5:].strip())
                    elif line.startswith('REDACT: "'):
                        redact_text, reason = line[8:].strip().split("|")
                        redact_text = redact_text.strip().strip('"')
                        reason = reason.strip()
                        ifg_rule = next(
                            (rule for rule in ifg_rules if rule["title"] == reason),
                            None,
                        )
                        if current_page and redact_text:
                            try:
                                page = doc[current_page - 1]
                                highlight = get_highlight(page, redact_text, ifg_rule)
                                if highlight:
                                    yield f"data: {json.dumps(highlight)}\n\n"

                            except Exception as e:
                                print(f"Error processing redaction: {e}")

        yield 'data: {"status": "completed"}\n\n'

    return generate


def process_pdf(doc: Document, prompt: str, model: str = "azure/gpt-4o-mini") -> list[dict]:
    highlights = []
    for highlight in process_pdf_streaming(doc, prompt, verbose=False, model=model)():
        if not highlight.startswith('data: {"status":'):
            highlights.append(json.loads(highlight.split("data: ")[1]))
    # remove duplicates but keep order
    unique_highlights = []
    for item in highlights:
        if item not in unique_highlights:
            unique_highlights.append(item)
    return unique_highlights
