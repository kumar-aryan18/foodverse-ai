import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")  # run `ollama list` and put YOUR model name here


class RecipeRequest(BaseModel):
    ingredients: str = ""
    dish: str = ""


def _as_list(v):
    if isinstance(v, str):
        return [s.strip() for s in v.split("\n") if s.strip()]
    if isinstance(v, list):
        out = []
        for x in v:
            if isinstance(x, dict):
                out.append(" ".join(str(i) for i in x.values()))
            else:
                out.append(str(x))
        return out
    return []


@router.post("/recipe")
def recipe(req: RecipeRequest):
    ingredients = req.ingredients.strip()
    dish = req.dish.strip()
    if not ingredients and not dish:
        raise HTTPException(status_code=400, detail="Describe your ingredients or upload a photo.")

    prompt = (
        "You are a helpful chef. Create ONE practical recipe.\n"
        f"Dish detected from a photo: {dish or 'none'}\n"
        f"User's description / ingredients: {ingredients or 'none'}\n\n"
        "Reply ONLY with JSON in exactly this shape:\n"
        '{"title": "string", "time": "e.g. 30 mins", "servings": "e.g. 2", '
        '"ingredients": ["amount + item", "..."], "steps": ["step 1", "..."], "tips": "one short tip"}'
    )
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.6},
    }
    http_req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(http_req, timeout=180) as r:
            body = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise HTTPException(
                status_code=503,
                detail=f"Model '{OLLAMA_MODEL}' is not installed. Run: ollama pull {OLLAMA_MODEL}",
            )
        raise HTTPException(status_code=500, detail=f"Ollama error {e.code}")
    except urllib.error.URLError:
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach Ollama at {OLLAMA_URL}. Start it and try again.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recipe generation failed: {e}")

    text = body.get("response", "")
    try:
        data = json.loads(text)
    except Exception:
        return {"title": dish or "Recipe", "raw": text}

    return {
        "title": str(data.get("title") or dish or "Recipe"),
        "time": str(data.get("time") or ""),
        "servings": str(data.get("servings") or ""),
        "ingredients": _as_list(data.get("ingredients")),
        "steps": _as_list(data.get("steps")),
        "tips": str(data.get("tips") or ""),
    }