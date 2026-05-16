import os
from fastapi import APIRouter, Form, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.services.analyzer import run_analysis
from app.services.parser import extract_text_from_pdf

router = APIRouter()

MAX_FILE_BYTES = 5 * 1024 * 1024   # 5 MB
MAX_TEXT_CHARS = 50_000


def _check_secret(request: Request) -> None:
    """Reject requests that don't carry the shared secret, if one is configured."""
    expected = os.getenv("API_SECRET", "")
    if not expected:
        return
    provided = request.headers.get("x-api-secret", "")
    if provided != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/analyze")
async def analyze(
    request: Request,
    jdText: str = Form(...),
    resumeText: str = Form(""),
    file: UploadFile | None = File(None),
):
    _check_secret(request)

    resume_text = resumeText
    jd_text = jdText

    if file and file.size and file.size > 0:
        if file.size > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="PDF must be under 5 MB")
        raw = await file.read()
        resume_text = extract_text_from_pdf(raw)

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is required. Paste your resume or upload a PDF.",
        )
    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    if len(resume_text) > MAX_TEXT_CHARS or len(jd_text) > MAX_TEXT_CHARS:
        raise HTTPException(
            status_code=413,
            detail="Input too long. Max 50,000 characters per field.",
        )

    result = run_analysis(resume_text, jd_text)
    return JSONResponse(result.api_dict())
