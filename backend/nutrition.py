import pandas as pd

_df = pd.read_csv("data/nutrition.csv").set_index("dish")

def get_nutrition(dish: str, grams: float | None = None) -> dict:
    row = _df.loc[dish]
    grams = grams or float(row["serving_g"])
    f = grams / 100
    kcal = round(row["kcal_per_100g"] * f)
    return {
        "dish": dish,
        "serving_g": round(grams),
        "calories_kcal": kcal,
        # range because portion size from a photo is uncertain
        "calories_range": [round(kcal * 0.8), round(kcal * 1.2)],
        "protein_g": round(row["protein_g"] * f, 1),
        "carbs_g": round(row["carbs_g"] * f, 1),
        "fat_g": round(row["fat_g"] * f, 1),
    }

def health_score(dish: str) -> dict:
    """Simple transparent heuristic, not medical advice."""
    r = _df.loc[dish]
    score = 70
    if r["kcal_per_100g"] > 300:
        score -= 20
    elif r["kcal_per_100g"] > 200:
        score -= 10
    if r["protein_g"] >= 10:
        score += 10
    if r["fat_g"] * 9 / r["kcal_per_100g"] > 0.45:
        score -= 10
    score = max(0, min(100, score))
    if score >= 75:
        label = "Good everyday choice"
    elif score >= 50:
        label = "Fine in moderation"
    else:
        label = "Occasional treat"
    return {"score": score, "label": label}