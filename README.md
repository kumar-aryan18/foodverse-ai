# FoodVerse AI – Multimodal Food Intelligence Agent

A multimodal AI platform that analyzes food images, videos, audio and user data to provide nutrition, freshness, hygiene, cooking and personalized meal insights.

## Modules

1. Food recognition and nutrition analysis (Food Lens: image + voice + text)
2. Food freshness and spoilage detection
3. Restaurant hygiene and safety monitoring
4. Smart cooking assistance (Smart Kitchen)
5. Personalized meal planning (Meal Planner)

## Tech stack

ReactJS (Vite), FastAPI, Python, OpenCV, PyTorch, Meta Llama, Ollama

## Repository Structure

```
1. Brainstorming & Ideation
2. Requirement Analysis
3. Project Design Phase
4. Project Planning Phase
5. Project Development Phase
6. Project Testing
7. Project Documentation
8. Project Demonstration
backend/      FastAPI services (source code)
frontend/     React app (source code)
models/       trained model files
notebooks/    experiments
scripts/      evaluation and helper scripts
tests/        test images
```

The numbered folders hold the project deliverables. The source code stays in `backend/` and `frontend/`, and `5. Project Development Phase` explains how it maps to the code.

## Run locally

```
pip install -r requirements.txt
uvicorn backend.main:app --reload --reload-dir backend

cd frontend
npm install
npm run dev
```

Open http://localhost:5173/

## Status

Work in progress.
