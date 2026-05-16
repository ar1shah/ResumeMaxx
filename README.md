# ResumeMaxx

Paste your resume and a job description — get back a match score, the skills you're missing, keywords ranked by importance, and bullet-by-bullet feedback on your experience section.

No accounts, no data stored on a server. History lives in your browser.

## Architecture

```
Browser → Next.js (Vercel) → FastAPI service (Railway)
                               └── scikit-learn TF-IDF
                               └── spaCy NLP
                               └── pdfplumber
```

Analysis runs on a **FastAPI** Python service using **scikit-learn** TF-IDF, **spaCy** NLP for skill extraction, and **pdfplumber** for PDF parsing. The Next.js frontend on **Vercel** proxies analysis requests to the Python API on **Railway**. If `PYTHON_API_URL` is unset (local dev without Python running), a TypeScript fallback analyzer handles requests automatically.

## What it does

- **Overall match score** — sklearn TF-IDF cosine similarity, scaled 0–100
- **Per-section scores** — same scoring applied to each detected resume section
- **Missing keywords** — high-frequency JD terms not found in your resume, ranked
- **Skill gap** — spaCy + vocabulary-matched skills split into matched / missing
- **Bullet audit** — action verb, metric, length, and passive phrasing checks

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui |
| Charts | Recharts |
| Python API | FastAPI, scikit-learn, spaCy, pdfplumber |
| Frontend deploy | Vercel |
| API deploy | Railway (Docker) |

## Local setup

**Option A — Next.js only (no Python)**

```bash
git clone https://github.com/YOUR_USERNAME/ResumeMaxx
cd ResumeMaxx
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The built-in TypeScript analyzer handles requests when `PYTHON_API_URL` is not set.

**Option B — Full stack with Python**

```bash
# Terminal 1: Python API
cd api
python -m venv .venv
# Windows: .venv\Scripts\activate  |  Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000

# Terminal 2: Next.js
cd ..
echo "PYTHON_API_URL=http://localhost:8000" > .env.local
npm run dev
```

**Option C — Docker Compose**

```bash
docker-compose up --build
```

Runs both services. Next.js at `localhost:3000`, Python API at `localhost:8000`.

## Running Python tests

```bash
cd api
pip install pytest
pytest tests/ -v
```

## Deploy

**Python API → Railway**

1. Create a new Railway project from the GitHub repo.
2. Set root directory to `api/`.
3. Add env vars: `FRONTEND_URL` (your Vercel URL), `API_SECRET` (random secret).
4. Deploy — Railway builds the Dockerfile and downloads the spaCy model automatically.

**Frontend → Vercel**

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add env vars: `PYTHON_API_URL` (Railway URL), `PYTHON_API_SECRET` (same secret as Railway).
3. Deploy.

See [ROADMAP.md](ROADMAP.md) for what's coming in Phase 2.
