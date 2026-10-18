import json
from pathlib import Path

import timm
import torch
from PIL import Image
from torchvision import transforms

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "freshness_binary.pt"
CLASSES_PATH = ROOT / "models" / "freshness_binary_classes.json"

# Decision band: between the two values the app says "not sure"
FRESH_ABOVE = 0.65
ROTTEN_BELOW = 0.35

with open(CLASSES_PATH) as f:
    classes = json.load(f)  # ["fresh", "rotten"]

model = timm.create_model("efficientnet_b0", pretrained=False,
                          num_classes=len(classes))
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

FRESH = classes.index("fresh")

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def to_rgb(img: Image.Image) -> Image.Image:
    """Paste transparent images onto white, as in training."""
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, img)
    return img.convert("RGB")


def safety_recommendation(state: str) -> str:
    if state == "fresh":
        return "Looks fresh. Still check smell and texture before eating."
    if state == "rotten":
        return "Looks spoiled. It is better to discard it."
    return "Not sure. Check smell, texture and the date before eating."


def check_freshness(img) -> dict:
    x = transform(to_rgb(img)).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(x), dim=1)[0]
    fresh_prob = float(probs[FRESH])

    if fresh_prob >= FRESH_ABOVE:
        state = "fresh"
    elif fresh_prob <= ROTTEN_BELOW:
        state = "rotten"
    else:
        state = "uncertain"

    return {
        "state": state,
        "confidence": round(max(fresh_prob, 1 - fresh_prob), 3),
        "fresh_probability": round(fresh_prob, 3),
        "recommendation": safety_recommendation(state),
        "disclaimer": ("Based on appearance only. It was trained on a few "
                       "common fruits and cannot guarantee food safety."),
    }