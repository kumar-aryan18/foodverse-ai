## Edge case testing

| Test case | Endpoint | Status | Behaviour |
|---|---|---|---|
| No file | /analyze-food | 422 | Rejected cleanly (missing body) |
| Text file | /analyze-food | 400 | "Please upload a JPG, PNG or WEBP image." |
| Non-food image | /analyze-food | 200 | "food": null — Low confidence rejected via MIN_CONF threshold |
| Normal food (placeholder) | /analyze-food | 200 | "food": null — Low confidence (<40%) safely rejected with message |
| No file | /check-freshness | 422 | Rejected cleanly (missing body) |
| Text file | /check-freshness | 400 | "Please upload a JPG, PNG or WEBP image." |
| Non-food image | /check-freshness | 200 | "state": "uncertain" (conf: 0.506) |
| Normal food | /check-freshness | 200 | "state": "fresh" (conf: 0.813) |