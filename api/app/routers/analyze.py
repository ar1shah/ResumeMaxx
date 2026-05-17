import os
from fastapi import APIRouter, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.services.analyzer import run_analysis
from app.services.parser import extract_text_from_pdf

router = APIRouter()

MAX_FILE_BYTES = 5 * 1024 * 1024   # 5 MB
MAX_TEXT_CHARS = 50_000


def _check_secret(request: Request) -> None:
    expected = os.getenv("API_SECRET", "")
    if not expected:
        return
    provided = request.headers.get("x-api-secret", "")
    if provided != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


async def _parse_body(request: Request) -> tuple[str, str]:
    """Accept JSON (from Vercel proxy) or multipart form (PDF upload)."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        return body.get("resumeText", ""), body.get("jdText", "")

    form = await request.form()
    resume_text = str(form.get("resumeText") or "")
    jd_text = str(form.get("jdText") or "")

    upload = form.get("file")
    if upload and isinstance(upload, UploadFile) and upload.filename:
        raw = await upload.read()
        if len(raw) > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="PDF must be under 5 MB")
        resume_text = extract_text_from_pdf(raw)

    return resume_text, jd_text


@router.post("/analyze")
async def analyze(request: Request):
    _check_secret(request)

    try:
        resume_text, jd_text = await _parse_body(request)

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
    except HTTPException:
        raise
    except Exception as exc:
        # Log-friendly message without leaking internals to clients
        raise HTTPException(status_code=500, detail=f"Analysis failed: {type(exc).__name__}") from exc
