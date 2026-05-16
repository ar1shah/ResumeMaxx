import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import analyze

load_dotenv()

app = FastAPI(title="ResumeMaxx API", version="1.0.0")

# CORS: the browser always talks to Next.js, so this matters only if you
# call the Python service directly (e.g. local curl tests or future clients).
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url, "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(analyze.router)


@app.get("/health")
@app.get("/")
async def health():
    return {"status": "ok"}
