const API_URL = "http://127.0.0.1:8000";

export async function analyzeFood(file) {
  const form = new FormData();
  form.append("file", file);

 const res = await fetch(`${API_URL}/analyze-food`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Prediction failed");
  }

  return await res.json();
}