from datetime import date
from pydantic import BaseModel

class KitchenItem(BaseModel):
    name: str
    expiry: date

INVENTORY: list[dict] = []   # resets when the server restarts (fine for a demo)
_next_id = 1

TIPS = {
    "milk": "Keep in the fridge at or below 5°C. Use within 2 days of opening.",
    "bread": "Store in a cool, dry place. Refrigerate in humid weather.",
    "tomato": "Keep at room temperature until ripe, then refrigerate.",
    "banana": "Store at room temperature, away from other fruit.",
    "curd": "Keep covered in the fridge and use within 3-4 days.",
    "paneer": "Keep in water in the fridge. Use within 3 days.",
    "rice": "Cooked rice should be refrigerated within 1 hour. Use within 24 hours.",
}
DEFAULT_TIP = "Store in a cool, dry place and check for spoilage before use."

def _status(item: dict):
    days_left = (item["expiry"] - date.today()).days
    if days_left < 0:
        state = "expired"
    elif days_left <= 2:
        state = "use_soon"
    else:
        state = "fresh"
    tip = next((t for k, t in TIPS.items() if k in item["name"].lower()), DEFAULT_TIP)
    return {**item, "expiry": item["expiry"].isoformat(),
            "days_left": days_left, "state": state, "tip": tip}

def list_items():
    return sorted((_status(i) for i in INVENTORY), key=lambda x: x["days_left"])

def add_item(item: KitchenItem):
    global _next_id
    INVENTORY.append({"id": _next_id, "name": item.name.strip(), "expiry": item.expiry})
    _next_id += 1

def remove_item(item_id: int):
    INVENTORY[:] = [i for i in INVENTORY if i["id"] != item_id]