import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function MealPlanner() {
  const [goal, setGoal] = useState("maintain");
  const [diet, setDiet] = useState("any");
  const [calories, setCalories] = useState(2000);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError(""); setPlan(null);
    try {
      const res = await fetch(`${API_URL}/meal-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, diet, calories: Number(calories) }),
      });
      if (!res.ok) throw new Error("Server error");
      setPlan(await res.json());
    } catch {
      setError("Could not generate a plan. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Personalised Meal Planner</h2>

      <label>Goal </label>
      <select value={goal} onChange={(e) => setGoal(e.target.value)}>
        <option value="lose">Lose weight</option>
        <option value="maintain">Maintain</option>
        <option value="gain">Gain weight</option>
      </select>

      <label style={{ marginLeft: 12 }}>Diet </label>
      <select value={diet} onChange={(e) => setDiet(e.target.value)}>
        <option value="any">Any</option>
        <option value="veg">Vegetarian</option>
        <option value="non-veg">Non-veg</option>
      </select>

      <label style={{ marginLeft: 12 }}>Daily calories </label>
      <input type="number" min="1200" max="4000" value={calories}
             onChange={(e) => setCalories(e.target.value)} style={{ width: 80 }} />

      <div style={{ marginTop: 16 }}>
        <button onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate plan"}
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {plan && (
        <div style={{ marginTop: 20 }}>
          <p>Daily target: <b>{plan.daily_target} kcal</b> | Plan total: <b>{plan.total_kcal} kcal</b></p>
          {Object.entries(plan.meals).map(([meal, m]) => (
            <div key={meal} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <h4 style={{ textTransform: "capitalize", margin: 0 }}>{meal}</h4>
              <p style={{ margin: "6px 0" }}>{m.items.join(" + ")}</p>
              <small>{m.kcal} kcal (target {m.target})</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}