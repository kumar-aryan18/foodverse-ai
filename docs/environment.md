# Environment Setup

- OS: Windows
- Python: 3.13.7
- Node.js: 22.x (React 19 + Vite)
- Virtual environment: `python -m venv venv`
- Install: `pip install -r requirements.txt`
- Reproducible install: `pip install -r requirements-lock.txt`
- Backend run: `uvicorn backend.main:app --reload`
- Frontend run: `cd frontend && npm install && npm run dev`
- LLM: Meta Llama 3.2 3B via Ollama (local, free)

## Approach
requirements.txt lists the libraries we chose, grouped by purpose.
requirements-lock.txt pins the exact installed versions for reproducibility.
Frontend dependencies are tracked in frontend/package.json.