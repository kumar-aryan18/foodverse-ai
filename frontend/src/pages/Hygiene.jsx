import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Hygiene() {
  const [checklist, setChecklist] = useState({});
  const [checked, setChecked] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/hygiene-checklist`)
      .then((r) => r.json())
      .then(setChecklist)
      .catch(() => setError("Could not load checklist. Is the backend running?"));
  }, []);

  function toggle(item) {
    setChecked((c) => (c.includes(item) ? c.filter((x) => x !== item) : [...c, item]));
  }

  async function submit() {
    setError("");
    try {
      const res = await fetch(`${API_URL}/hygiene-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError("Could not calculate the score.");
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Restaurant Hygiene and Smart Kitchen Check</h2>

      {Object.entries(checklist).map(([section, items]) => (
        <div key={section} style={{ marginBottom: 14 }}>
          <h4 style={{ marginBottom: 6 }}>{section}</h4>
          {items.map((item) => (
            <label key={item} style={{ display: "block" }}>
              <input type="checkbox" checked={checked.includes(item)}
                     onChange={() => toggle(item)} /> {item}
            </label>
          ))}
        </div>
      ))}

      <button onClick={submit}>Calculate score</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16, border: "1px solid #ccc", borderRadius: 8, padding: 12 }}>
          <h3>Score: {result.score}% (Grade {result.grade})</h3>
          {result.missing.length > 0 && (
            <>
              <b>Needs attention:</b>
              <ul>{result.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}