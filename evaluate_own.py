import sys
from pathlib import Path
from PIL import Image
from backend.freshness import check_freshness

root = Path(sys.argv[1])
rows = []
for label in ("fresh", "rotten"):
    for p in sorted((root / label).glob("*")):
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        r = check_freshness(Image.open(p).convert("RGB"))
        rows.append((p.name, label, r["state"]))
        ok = "OK " if label == r["state"] else "ERR"
        print(f"{ok} {p.name:25s} true={label:7s} pred={r['state']:7s} "
            f"conf={r['confidence']:.2f}")

correct = sum(1 for _, t, p in rows if t == p)
print(f"\nAccuracy on own photos: {correct}/{len(rows)} = {correct / len(rows):.1%}")
for label in ("fresh", "rotten"):
    sub = [r for r in rows if r[1] == label]
    if sub:
        c = sum(1 for r in sub if r[2] == label)
        print(f"  {label}: {c}/{len(sub)}")