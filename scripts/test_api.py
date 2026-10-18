import requests
BASE = "http://127.0.0.1:8000"

def hit(name, endpoint, files=None):
    try:
        r = requests.post(BASE + endpoint, files=files, timeout=60)
        print(f"{name:28} {endpoint:18} -> {r.status_code}  {r.text[:100]}")
    except Exception as e:
        print(f"{name:28} {endpoint:18} -> CRASH {e}")

for ep in ["/analyze-food", "/check-freshness"]:
    hit("no file", ep)
    hit("text file", ep, {"file": ("a.txt", b"hello", "text/plain")})
    with open("tests/chair.jpg", "rb") as f:
     hit("non-food image", ep, {"file": ("chair.jpg", f.read(), "image/jpeg")})
    with open("tests/apple.jpg", "rb") as f:
     hit("normal food", ep, {"file": ("apple.jpg", f.read(), "image/jpeg")}) 