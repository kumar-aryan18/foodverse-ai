import io
import json
from pathlib import Path

import timm
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms

from backend.nutrition import get_nutrition, health_score

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
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "FoodVerse AI backend is running"}


@app.post("/analyze-food")
async def analyze_food(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Please upload a JPG, PNG or WEBP image.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is too large (max 5 MB).")
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Could not read the image.")

    x = transform(img).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(x), dim=1)[0]
    top = torch.topk(probs, 3)
    top3 = [{"dish": classes[i], "confidence": round(p.item(), 3)}
            for p, i in zip(top.values, top.indices)]
    best = top3[0]

    result = {
        "prediction": best,
        "top3": top3,
        "nutrition": get_nutrition(best["dish"]),
        "health": health_score(best["dish"]),
    }
    if best["confidence"] < 0.5:
        result["note"] = "Low confidence. Try a clearer photo with good lighting."
    return result