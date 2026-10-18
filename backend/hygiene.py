from pydantic import BaseModel

CHECKLIST = {
    "Personal hygiene": [
        "Hands washed with soap",
        "Hair covered",
        "Clean uniform or apron"
    ],
    "Food handling": [
        "Raw and cooked food stored separately",
        "Food covered",
        "Expiry dates checked"
    ],
    "Kitchen cleanliness": [
        "Surfaces sanitised",
        "Utensils clean and dry",
        "Waste bins covered"
    ],
    "Storage": [
       "Fridge at or below 5 C",
        "Freezer at or below -18 C",
        "No signs of pests"
    ]
}

ALL_ITEMS = [i for items in CHECKLIST.values() for i in items]

class HygieneRequest(BaseModel):
    checked: list[str]

def score(req: HygieneRequest):
    done = set(req.checked) & set(ALL_ITEMS)
    pct = round(100 * len(done) / len(ALL_ITEMS))
    grade = "A" if pct >= 85 else "B" if pct >= 65 else "C" if pct >= 40 else "D"
    return {
        "score": pct,
        "grade": grade,
        "missing": [i for i in ALL_ITEMS if i not in done]
    }
