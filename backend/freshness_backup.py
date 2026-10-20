import json
from pathlib import Path
from PIL import Image

import timm
import torch
from torchvision import transforms

# Two underscores on both sides: __file__
ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "freshness_binary.pt"
CLASSES_PATH = ROOT / "models" / "freshness_binary_classes.json"

with open(CLASSES_PATH) as f:
    classes = json.load(f)

# Binary model: classes = ["fresh", "rotten"] -> index 0 is fresh
FRESH_IDX = [0]

model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=len(classes))
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

# Clean transform without HTML span artifacts
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
def check_freshness(image_input):
    """
    Accepts either a file path string/Path object or a PIL Image.
    Returns a dict with the predicted label and confidence.
    """
    if isinstance(image_input, (str, Path)):
        img = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
    else:
        # Handles raw bytes/file streams if passed
        img = Image.open(image_input).convert("RGB")

    tensor = transform(img).unsqueeze(0)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)[0]
        conf, pred_idx = torch.max(probs, dim=0)

    predicted_label = classes[pred_idx.item()]
    confidence = float(conf.item())

    # Map to fresh/rotten status
    is_fresh = pred_idx.item() in FRESH_IDX

    # Determine the produce type from the predicted label (or default to "unknown")
    produce_type = "unknown"
    for fruit in ["apple", "banana", "orange"]:
        if fruit in predicted_label.lower():
            produce_type = fruit
            break

    return {
        "state": "fresh" if is_fresh else "rotten",
        "produce": produce_type,
        "label": predicted_label,
        "is_fresh": is_fresh,
        "confidence": confidence,
        "raw_scores": {classes[i]: float(probs[i]) for i in range(len(classes))}
    }