FROM python:3.11-slim

WORKDIR /app

# System deps for pdfplumber (poppler) and spaCy
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model at build time so cold starts don't have to fetch it
RUN python -m spacy download en_core_web_sm

COPY . .

# Railway sets PORT automatically; default to 8000 for local/docker-compose use
ENV PORT=8000
EXPOSE $PORT

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
