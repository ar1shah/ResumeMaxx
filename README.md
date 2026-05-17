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

- **Overall match score** — composite 0–100 score combining four signals (see Scoring below)
- **Score breakdown** — per-component view of what is driving your score
- **Per-section scores** — each detected resume section scored against JD requirements
- **Missing keywords** — high-frequency JD requirements terms not found in your resume, ranked
- **Skill gap** — vocabulary-matched skills split into matched / missing
- **Bullet audit** — action verb, metric, length, and passive phrasing checks

## Scoring

The overall 0–100 match score is a **weighted composite** of four independently computed signals. Unlike plain keyword matching or full-document cosine similarity, this approach reflects how a recruiter actually evaluates fit.

| Component | Weight | What it measures |
|-----------|--------|-----------------|
| **Skill fit** | 40% | Vocabulary-matched skills weighted by required vs. nice-to-have classification |
| **Requirements coverage** | 30% | Fraction of JD requirements TF-IDF term mass addressed by the resume |
| **Experience alignment** | 15% | Years-of-experience from resume vs. JD range (3-5 years, 5+ years, etc.) |
| **Section relevance** | 15% | Per-section TF-IDF coverage vs. requirements text, weighted by section importance |

**Skill fit formula:**
```
fit = (required_matched + 0.5 × nice_to_have_matched)
    / (total_required + 0.5 × total_nice_to_have) × 100
```

Missing a required skill costs a full point; missing a nice-to-have costs half a point. The JD is first parsed into requirements, nice-to-have, and noise (benefits/EEO boilerplate) sections so the signal is focused.

**Calibration:** A strong candidate matching 8 of 11 signals (all required, 3 nice-to-have gaps) scores **~82–85**. An unrelated candidate scores **<25**. Golden fixtures and range tests live in `data/fixtures/scoring-golden.json` and `api/tests/test_match_score.py`.

Per-section charts and keyword gap continue to use the existing TF-IDF/coverage approach scoped to requirements text (not the full noisy JD).

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

## Running tests

```bash
cd api
pip install pytest
pytest tests/ -v
```

Tests cover the composite scorer, golden fixture range assertions (calibration), JD extraction, experience alignment, skill fit, bullet audit, and the legacy TF-IDF scorer. `test_match_score.py` is the primary calibration suite — if you change weights in `match_score.py`, re-run these tests.

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

See [ROADMAP.md](ROADMAP.md) for what's planned.
