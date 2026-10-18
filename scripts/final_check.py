import time
import requests

BASE = "http://127.0.0.1:8000"
RUNS = 5

def run_image(endpoint, path):
    with open(path, "rb") as f:
        return requests.post(
            BASE + endpoint,
            files={"file": ("apple.jpg", f, "image/jpeg")},
            timeout=60,
        )

CHECKS = {
    "Food recognition": lambda: run_image("/analyze-food", "tests/apple.jpg"),
    "Freshness":        lambda: run_image("/check-freshness", "tests/apple.jpg"),
    "Meal planner":     lambda: requests.post(BASE + "/meal-plan",
                            json={"goal": "lose", "diet": "veg", "calories": 2000}, timeout=30),
    "Hygiene checklist": lambda: requests.get(BASE + "/hygiene-checklist", timeout=30),
    "Hygiene score":    lambda: requests.post(BASE + "/hygiene-score",
                            json={"checked": []}, timeout=30),
    "Smart kitchen":    lambda: requests.get(BASE + "/kitchen/items", timeout=30),
}

print(f"{'Module':20} {'Passed':8} {'Avg time':10}")
for name, fn in CHECKS.items():
    ok, times, last_error = 0, [], ""
    for _ in range(RUNS):
        start = time.time()
        try:
            r = fn()
            if r.status_code == 200:
                ok += 1
            else:
                last_error = f"{r.status_code} {r.text[:150]}"
        except Exception as e:
            last_error = f"CRASH {e}"
        times.append(time.time() - start)
    print(f"{name:20} {ok}/{RUNS:<6} {sum(times) / RUNS:.2f}s")
    if last_error:
        print(f"   -> {last_error}")