import { useState } from "react";
import {
  Calendar, User, Utensils, TrendingUp, Activity, Droplets, Target,
  FileText, Loader2, AlertTriangle,
} from "lucide-react";
import { generateAIMealPlan } from "../api";

export default function MealPlanner() {
  const [f, setF] = useState({
    age: "25", gender: "Female", height: "165", weight: "60", activity: "Moderate",
    goal: "Maintenance", diet: "Standard", cuisine: "Global",
    allergies: "", conditions: "", history: "",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    const age = Number(f.age), height = Number(f.height), weight = Number(f.weight);
    if (![age, height, weight].every(Number.isFinite) || !age || !height || !weight) {
      setError("Please enter a valid age, height and weight.");
      return;
    }
    setError("");
    setLoading(true);
    setPlan(null);
    try {
      setPlan(await generateAIMealPlan({
        age, gender: f.gender, height_cm: height, weight_kg: weight, activity: f.activity,
        goal: f.goal, diet: f.diet, cuisine: f.cuisine,
        allergies: f.allergies, conditions: f.conditions, history: f.history,
      }));
    } catch (e) {
      setError(e.message || "Could not generate the plan");
    } finally {
      setLoading(false);
    }
  };

  const t = plan?.targets;
  const stats = t && [
    { label: "DAILY CALORIES", value: t.calories, sub: "Target", icon: TrendingUp, cls: "g" },
    { label: "PROTEIN", value: `${t.protein_g}g`, sub: "Muscle Repair", icon: Activity, cls: "b" },
    { label: "HYDRATION", value: `${t.hydration_l} Liters`, sub: "Water Intake", icon: Droplets, cls: "c" },
    { label: "PLAN MATCH", value: `${t.plan_match}%`, sub: `Meals: ${plan.total_kcal} kcal`, icon: Target, cls: "p" },
  ];

  return (
    <div className="mp-page">
      <div className="mp-head">
        <h1><Calendar size={22} /> AI Personalized Meal Planner</h1>
        <p>Powered by a local Llama model • Personalised nutrition plans</p>
      </div>

      <div className="mp-grid">
        {/* ---------------- Profile form ---------------- */}
        <aside className="mp-form">
          <h3 className="mp-fh"><User size={14} /> Your Profile</h3>

          <div className="mp-2">
            <div><label>AGE</label><input value={f.age} onChange={set("age")} inputMode="numeric" /></div>
            <div><label>GENDER</label>
              <select value={f.gender} onChange={set("gender")}>
                <option>Female</option><option>Male</option><option>Other</option>
              </select></div>
            <div><label>HEIGHT (CM)</label><input value={f.height} onChange={set("height")} inputMode="decimal" /></div>
            <div><label>WEIGHT (KG)</label><input value={f.weight} onChange={set("weight")} inputMode="decimal" /></div>
          </div>
          <label>ACTIVITY LEVEL</label>
          <select value={f.activity} onChange={set("activity")}>
            <option>Sedentary</option><option>Light</option><option>Moderate</option>
            <option>Active</option><option>Very Active</option>
          </select>

          <hr />
          <h4 className="mp-sec">GOALS &amp; PREFERENCES</h4>
          <label>PRIMARY GOAL</label>
          <select value={f.goal} onChange={set("goal")}>
            <option>Weight Loss</option><option>Maintenance</option><option>Muscle Gain</option>
          </select>
          <div className="mp-2">
            <div><label>DIET TYPE</label>
              <select value={f.diet} onChange={set("diet")}>
                <option>Standard</option><option>Vegetarian</option><option>Vegan</option>
                <option>Eggetarian</option><option>Keto</option><option>High Protein</option>
              </select></div>
            <div><label>CUISINE</label>
              <select value={f.cuisine} onChange={set("cuisine")}>
                <option>Global</option><option>Indian</option><option>Mediterranean</option>
                <option>Asian</option><option>Western</option>
              </select></div>
          </div>
          <label>ALLERGIES (CRITICAL)</label>
          <input placeholder="e.g. Peanuts, Dairy" value={f.allergies} onChange={set("allergies")} />

          <hr />
          <h4 className="mp-sec">MEDICAL &amp; HISTORY</h4>
          <label>MEDICAL CONDITIONS</label>
          <input placeholder="e.g. Diabetes, PCOS" value={f.conditions} onChange={set("conditions")} />
          <label>RECENT FOOD HISTORY</label>
          <input placeholder="What did you eat today?" value={f.history} onChange={set("history")} />

          <button className="mp-btn" onClick={generate} disabled={loading}>
            {loading ? <><Loader2 size={15} className="spin" /> Planning...</> : "Generate AI Plan"}
          </button>
          {error && <p className="fl-err">{error}</p>}
        </aside>

        {/* ---------------- Results ---------------- */}
        <section className="mp-right">
          {loading ? (
            <div className="mp-empty">
              <Loader2 size={40} className="spin" />
              <h3>Building your plan...</h3>
              <p>A local model is writing your meals. This can take 30 seconds to a couple of minutes.</p>
            </div>
          ) : !plan ? (
            <div className="mp-empty">
              <Utensils size={48} />
              <h3>Ready to Plan Your Nutrition?</h3>
              <p>Fill in your health details on the left to receive a fully personalized meal plan generated by AI.</p>
            </div>
          ) : (
            <>
              {plan.warnings.length > 0 && (
                <div className="mp-warn">
                  <AlertTriangle size={16} />
                  <div>{plan.warnings.map((w, i) => <p key={i}>{w}</p>)}</div>
                </div>
              )}

              <div className="mp-stats">
                {stats.map((s) => (
                  <div key={s.label} className="mp-stat">
                    <div className="mp-stat-top"><span>{s.label}</span><s.icon size={16} className={s.cls} /></div>
                    <b>{s.value}</b>
                    <small>{s.sub}</small>
                  </div>
                ))}
              </div>

              <div className="mp-card">
                <div className="mp-card-h"><Utensils size={14} /> Today's Detailed Plan</div>
                {plan.meals.map((m, i) => (
                  <div key={i} className="mp-meal">
                    <div className="mp-meal-top">
                      <div>
                        <span className="mp-tag">{m.type}</span>
                        <b className="mp-name">{m.name}</b>
                      </div>
                      <div className="mp-kcal">{m.kcal} kcal
                        <small>P: {m.protein_g}g<br />C: {m.carbs_g}g<br />F: {m.fat_g}g</small>
                      </div>
                    </div>
                    {m.description && <p className="mp-desc">{m.description}</p>}
                    {m.ingredients.length > 0 && (
                      <div className="mp-chips">{m.ingredients.map((x, j) => <span key={j}>{x}</span>)}</div>
                    )}
                    {m.note && <div className="mp-note"><FileText size={12} /> {m.note}</div>}
                  </div>
                ))}
              </div>

              <div className="mp-bottom">
                <div className="mp-card">
                  <div className="mp-card-h"><Calendar size={14} /> Weekly Overview</div>
                  <div className="mp-week">
                    {plan.weekly.map((w, i) => (
                      <div key={i} className="mp-day"><em>{w.day}</em><p>{w.summary}</p></div>
                    ))}
                  </div>
                </div>

                <div className="mp-card mp-coach">
                  <div className="mp-card-h"><TrendingUp size={14} /> AI Coach Report</div>
                  <h5>CONSISTENCY CHECK</h5>
                  <b>{plan.coach.consistency}</b>
                  {plan.coach.suggestions.length > 0 && (
                    <>
                      <h5>ADAPTIVE SUGGESTIONS</h5>
                      <ul>{plan.coach.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </>
                  )}
                  {plan.coach.message && <blockquote>"{plan.coach.message}"</blockquote>}
                </div>
              </div>

              <p className="mp-disc">General nutrition guidance only, not medical advice. If you have a medical condition or allergy, confirm this plan with a doctor or dietitian.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}