import io
import re
import pdfplumber


def extract_text_from_pdf(raw_bytes: bytes) -> str:
    """Extract plain text from a PDF byte stream using pdfplumber.

    pdfplumber is more layout-aware than many alternatives and handles
    multi-column resumes better, though no extractor is perfect for all
    PDF types. Paste fallback is always available on the frontend.
    """
    text_parts: list[str] = []

    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)

    raw = "\n".join(text_parts)
    # Collapse runs of 3+ blank lines that extraction often introduces
    return re.sub(r"\n{3,}", "\n\n", raw).strip()
