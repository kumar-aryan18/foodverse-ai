from itertools import combinations
from pydantic import BaseModel


class PlanRequest(BaseModel):
    goal: str = "maintain"   # lose / maintain / gain
    diet: str = "any"        # veg / non-veg / any
    calories: int = 2000

# (name, kcal, is_veg)
DISHES = {
    "breakfast": [
        ("Poha", 250, True),
        ("Idli (3 pcs)", 180, True),
        ("Omelette", 220, False),
        ("Oats with fruit", 300, True),
        ("Paratha with curd", 350, True)
    ],
    "lunch": [
        ("Dal and rice", 450, True),
        ("Chicken curry and roti", 550, False),
        ("Paneer sabzi and roti", 500, True),
        ("Rajma chawal", 480, True),
        ("Salad bowl", 200, True)
    ],
    "dinner": [
        ("Khichdi", 350, True),
        ("Grilled chicken and veggies", 400, False),
        ("Vegetable soup", 150, True),
        ("Roti and mixed veg", 320, True),
        ("Curd rice", 280, True)
    ]
}

SHARE = {"breakfast": 0.25, "lunch": 0.40, "dinner": 0.35}
ADJUST = {"lose": -400, "maintain": 0, "gain": 400}

def build_plan(req: PlanRequest):
    total = req.calories + ADJUST.get(req.goal, 0)
    plan, day_kcal = {}, 0

    for meal, share in SHARE.items():
        target = total * share
        options = [d for d in DISHES[meal] if req.diet != "veg" or d[2]]
        if req.diet == "non-veg":
            options = [d for d in DISHES[meal] if not d[2]] or options

        # Pick 1-2 dish combination closest to the calorie target
        combos = [c for n in (1, 2) for c in combinations(options, n)]
        best = min(combos, key=lambda c: abs(sum(d[1] for d in c) - target))
        kcal = sum(d[1] for d in best)
        plan[meal] = {
            "items": [d[0] for d in best],
            "kcal": kcal,
            "target": round(target)
        }
        day_kcal += kcal

    return {
        "goal": req.goal,
        "diet": req.diet,
        "daily_target": total,
        "total_kcal": day_kcal,
        "meals": plan
    }
