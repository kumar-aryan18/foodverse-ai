import io
import json
from pathlib import Path

import timm
import torch
import torch.nn as nn
import torchvision.models as models
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms

from backend.freshness import check_freshness, to_rgb
from backend.hygiene import HygieneRequest, CHECKLIST, score
from backend.meal_planner import PlanRequest, build_plan
from backend.nutrition import get_nutrition, health_score
from backend.smart_kitchen import KitchenItem, list_items, add_item, remove_item
from backend.meal_ai import router as meal_ai_router


ALLOWED = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024

async def read_image(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Please upload a JPG, PNG or WEBP image.")
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file.")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image too large (max 5 MB).")
    return data

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "foodverse_effb0.pt"
CLASSES_PATH = ROOT / "models" / "classes.json"
MAX_BYTES = 5 * 1024 * 1024

with open(CLASSES_PATH) as f:
    classes = json.load(f)

import torchvision.models as models
import torch.nn as nn

model = models.efficientnet_b0(weights=None)
in_features = model.classifier[1].in_features
model.classifier[1] = nn.Linear(in_features, len(classes))
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

app = FastAPI(title="FoodVerse AI")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)
from backend.voice import router as voice_router
app.include_router(voice_router)
from backend.recipe import router as recipe_router
app.include_router(recipe_router)
from backend.voice import router as voice_router
app.include_router(voice_router)
from backend.recipe import router as recipe_router
app.include_router(recipe_router)
app.include_router(meal_ai_router)
async def load_image(file: UploadFile) -> Image.Image:
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Please upload a JPG, PNG or WEBP image.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is too large (max 5 MB).")
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Could not read the image.")

@app.get("/")
def home():
    return {"message": "FoodVerse AI backend is running"}


def match_from_text(text: str):
    t = (text or "").lower().replace("_", " ")
    if not t.strip():
        return None
    for c in classes:
        if c.lower().replace("_", " ") in t:
            return c
    return None


@app.post("/analyze-food")
async def analyze_food(file: UploadFile = File(...), description: str = Form("")):
    img = await load_image(file)
    x = transform(img).unsqueeze(0)
    with torch.no_grad():
        outputs = model(x)
        probs = torch.softmax(outputs, dim=-1)[0]

    idx = int(probs.argmax())
    label = classes[idx]
    confidence = float(probs[idx])
    source = "image"

    MIN_CONF = 0.40
    if confidence < MIN_CONF:
        hinted = match_from_text(description)
        if hinted:
            label = hinted
            source = "description"
        else:
            return {
                "food": None,
                "confidence": round(confidence, 3),
                "nutrition": None,
                "message": "Couldn't recognise this food confidently. Try a clearer photo of a single dish, or describe it in the description box.",
            }

    nutrition = get_nutrition(label)

    return {
        "food": label,
        "confidence": round(confidence, 3),
        "nutrition": nutrition,
        "health_score": health_score(label),
        "source": source,
    }


@app.post("/check-freshness")
async def check_freshness_endpoint(file: UploadFile = File(...)):
    img = await load_image(file)
    return check_freshness(img)
@app.post("/plan-meal")
def plan_meal(req: PlanRequest):
    return build_plan(req)
@app.post("/meal-plan")
def meal_plan(req: PlanRequest):
    return build_plan(req)

@app.get("/hygiene-checklist")
def hygiene_checklist():
    return CHECKLIST

@app.post("/hygiene-score")
def hygiene_score(req: HygieneRequest):
    return score(req)
@app.get("/kitchen/items")
def kitchen_items():
    return list_items()

@app.post("/kitchen/items")
def kitchen_add(item: KitchenItem):
    if not item.name.strip():
        raise HTTPException(400, "Item name is required.")
    add_item(item)
    return list_items()

@app.delete("/kitchen/items/{item_id}")
def kitchen_delete(item_id: int):
    remove_item(item_id)
    return list_items()