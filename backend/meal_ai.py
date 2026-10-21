import json
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.recipe import OLLAMA_MODEL, OLLAMA_URL, _as_list

router = APIRouter()

ACTIVITY = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725, "very active": 1.9}
GOAL_ADJ = {"weight loss": -500, "maintenance": 0, "muscle gain": 300}
PROTEIN_PER_KG = {"weight loss": 1.6, "maintenance": 1.2, "muscle gain": 1.8}
SPLIT = [("Breakfast", 0.25), ("Mid Morning Snack", 0.10), ("Lunch", 0.30), ("Evening Snack", 0.10), ("Dinner", 0.25)]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

SYNONYMS = {
    "dairy": ["milk", "cheese", "yogurt", "yoghurt", "butter", "paneer", "curd", "cream", "dairy"],
    "milk": ["milk", "cheese", "yogurt", "yoghurt", "butter", "paneer", "curd", "cream"],
    "nuts": ["almond", "cashew", "walnut", "pistachio", "peanut", "hazelnut", "pecan", "nut"],
    "peanuts": ["peanut"],
    "gluten": ["wheat", "bread", "pasta", "flour", "barley", "wrap", "toast", "gluten"],
    "eggs": ["egg"],
    "shellfish": ["shrimp", "prawn", "crab", "lobster", "shellfish"],
    "soy": ["soy", "tofu", "edamame"],
    "fish": ["fish", "salmon", "tuna", "cod"],
}


class MealAIRequest(BaseModel):
    age: int = Field(25, ge=12, le=100)
    gender: str = "Female"
    height_cm: float = Field(165, ge=100, le=230)
    weight_kg: float = Field(60, ge=30, le=250)
    activity: str = "Moderate"
    goal: str = "Maintenance"
    diet: str = "Standard"
    cuisine: str = "Global"
    allergies: str = ""
    conditions: str = ""
    history: str = ""


def _targets(r: MealAIRequest):
    g = r.gender.lower()
    base = 10 * r.weight_kg + 6.25 * r.height_cm - 5 * r.age
    bmr = base + (5 if g == "male" else -161 if g == "female" else -78)
    tdee = bmr * ACTIVITY.get(r.activity.lower(), 1.55)
    goal = r.goal.lower()
    kcal = max(tdee + GOAL_ADJ.get(goal, 0), 1200)
    kcal = int(round(kcal / 10) * 10)
    protein = int(round(r.weight_kg * PROTEIN_PER_KG.get(goal, 1.2)))
    water = round(r.weight_kg * 0.035, 1)
    return kcal, protein, water


def _num(v, default=0):
    try:
        return int(round(float(str(v).lower().replace("kcal", "").replace("g", "").strip())))
    except Exception:
        return default


def _ollama_json(prompt: str) -> dict:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.5, "num_predict": 2500},
    }
    http_req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(http_req, timeout=300) as r:
            body = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
            err_body = e.read().decode()
            print("OLLAMA RESPONSE:", err_body)
            if e.code == 404:
                raise HTTPException(503, f"Model '{OLLAMA_MODEL}' is not installed. Run: ollama pull {OLLAMA_MODEL}")
            raise HTTPException(500, f"Ollama error {e.code}: {err_body}")
    except urllib.error.URLError:
        raise HTTPException(503, f"Could not reach Ollama at {OLLAMA_URL}. Start it and try again.")
    except Exception as e:
        raise HTTPException(500, f"Plan generation failed: {e}")
    try:
        return json.loads(body.get("response", ""))
    except Exception:
        raise HTTPException(502, "The model returned an invalid plan. Try again, or use a larger model.")


def _allergy_warnings(allergies: str, meals: list) -> list:
    warnings = []
    tokens = [t.strip().lower() for t in allergies.replace(" and ", ",").split(",") if t.strip()]
    for tok in tokens:
        terms = SYNONYMS.get(tok) or SYNONYMS.get(tok.rstrip("s")) or [tok.rstrip("s")]
        for m in meals:
            text = " ".join([m["name"], m["description"], *m["ingredients"]]).lower()
            if any(t in text for t in terms):
                warnings.append(f"'{m['name']}' may contain {tok}. Check before eating.")
    return warnings


@router.post("/ai-meal-plan")
def ai_meal_plan(req: MealAIRequest):
    kcal, protein, water = _targets(req)
    split = ", ".join(f"{n}: about {int(kcal * p)} kcal" for n, p in SPLIT)

    prompt = (
        "You are a careful nutrition coach. Create a one-day meal plan plus a 7-day overview.\n"
        f"Profile: {req.age} years, {req.gender}, {req.height_cm} cm, {req.weight_kg} kg, activity {req.activity}.\n"
        f"Goal: {req.goal}. Diet type: {req.diet}. Cuisine: {req.cuisine}.\n"
        f"Allergies (NEVER include these or anything derived from them): {req.allergies or 'none'}.\n"
        f"Medical conditions: {req.conditions or 'none'}. Recent food history: {req.history or 'not given'}.\n"
        f"Daily target: {kcal} kcal and about {protein} g protein. Meal split: {split}.\n"
        "Rules: follow the diet type strictly, keep meals simple and realistic, be general (not medical advice) and "
        "if a medical condition is listed, add a suggestion to confirm the plan with a doctor or dietitian.\n\n"
        "Reply ONLY with JSON in exactly this shape:\n"
        '{"meals":[{"type":"Breakfast","name":"","description":"","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,'
        '"ingredients":["",""],"note":"why this meal"}],'
        '"weekly":[{"day":"Mon","summary":"three meals in one sentence"}],'
        '"coach":{"consistency":"High","suggestions":["",""],"message":"one encouraging sentence"}}\n'
        "meals must contain exactly 5 items in this order: Breakfast, Mid Morning Snack, Lunch, Evening Snack, Dinner. "
        "weekly must contain 7 items: Mon, Tue, Wed, Thu, Fri, Sat, Sun."
    )

    data = _ollama_json(prompt)

    meals = []
    for m in data.get("meals", []) if isinstance(data.get("meals"), list) else []:
        if not isinstance(m, dict):
            continue
        meals.append({
            "type": str(m.get("type") or "Meal"),
            "name": str(m.get("name") or "Meal"),
            "description": str(m.get("description") or ""),
            "kcal": _num(m.get("kcal")),
            "protein_g": _num(m.get("protein_g")),
            "carbs_g": _num(m.get("carbs_g")),
            "fat_g": _num(m.get("fat_g")),
            "ingredients": _as_list(m.get("ingredients")),
            "note": str(m.get("note") or ""),
        })
    if not meals:
        raise HTTPException(502, "The model returned no meals. Try again.")

    weekly = []
    for i, w in enumerate(data.get("weekly", []) if isinstance(data.get("weekly"), list) else []):
        if isinstance(w, dict):
            summ = w.get("summary") or w.get("meals") or ""
            if isinstance(summ, list):
                summ = ", ".join(str(x) for x in summ)
            weekly.append({"day": str(w.get("day") or DAYS[i % 7])[:3], "summary": str(summ)})
        elif isinstance(w, str):
            weekly.append({"day": DAYS[i % 7], "summary": w})

    c = data.get("coach") if isinstance(data.get("coach"), dict) else {}
    coach = {
        "consistency": str(c.get("consistency") or "Medium"),
        "suggestions": _as_list(c.get("suggestions")),
        "message": str(c.get("message") or ""),
    }

    total = sum(m["kcal"] for m in meals)
    plan_match = max(0, round(100 - abs(total - kcal) / kcal * 100)) if total else 0

    return {
        "targets": {"calories": kcal, "protein_g": protein, "hydration_l": water, "plan_match": plan_match},
        "total_kcal": total,
        "meals": meals,
        "weekly": weekly,
        "coach": coach,
        "warnings": _allergy_warnings(req.allergies, meals),
    }