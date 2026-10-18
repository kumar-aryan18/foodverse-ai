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
        fp = r.get("fresh_probability")
        if fp is None:
            fp = r["raw_scores"]["fresh"]
        rows.append((p.name, label, fp))

fresh = [r for r in rows if r[1] == "fresh"]
rotten = [r for r in rows if r[1] == "rotten"]

print("Call it fresh only if fresh_probability >= t")
print("t     fresh_ok  rotten_ok  overall")
for t in (0.5, 0.6, 0.7, 0.8, 0.9):
    f_ok = sum(1 for r in fresh if r[2] >= t)
    r_ok = sum(1 for r in rotten if r[2] < t)
    print(f"{t:.1f}   {f_ok:>2}/{len(fresh)}     {r_ok:>2}/{len(rotten)}      "
          f"{(f_ok + r_ok) / len(rows):.1%}")

print("\nWith a 'not sure' band in the middle:")
for lo, hi in ((0.3, 0.7), (0.25, 0.75), (0.2, 0.8)):
    sure = [(l, fp) for _, l, fp in rows if fp >= hi or fp <= lo]
    ok = sum(1 for l, fp in sure if (l == "fresh") == (fp >= hi))
    print(f"band {lo}-{hi}: answered {len(sure)}/{len(rows)}, correct {ok}/{len(sure)}")

print("\nRotten photos called fresh at 0.5:")
for n, l, fp in rows:
    if l == "rotten" and fp >= 0.5:
        print("  ", n, round(fp, 2))
print("Fresh photos called rotten at 0.5:")
for n, l, fp in rows:
    if l == "fresh" and fp < 0.5:
        print("  ", n, round(fp, 2))