## Edge case testing

| Test case | Endpoint | Status | Behaviour |
|---|---|---|---|
| No file | /analyze-food | 422 | Rejected cleanly (missing body) |
| Text file | /analyze-food | 400 | "Please upload a JPG, PNG or WEBP image." |
| Non-food image | /analyze-food | 200 | Low confidence prediction (0.062) |
| Normal food | /analyze-food | 200 | Processed successfully (0.063) |
| No file | /check-freshness | 422 | Rejected cleanly (missing body) |
| Text file | /check-freshness | 400 | "Please upload a JPG, PNG or WEBP image." |
| Non-food image | /check-freshness | 200 | Returned uncertain state (conf: 0.506) |
| Normal food | /check-freshness | 200 | Returned fresh state (conf: 0.813) |
