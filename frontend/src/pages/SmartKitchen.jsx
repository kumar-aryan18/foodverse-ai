import { useEffect, useState } from "react";
import { ChefHat, Type, Upload, ArrowRight, Loader2, Trash2, Plus, Clock, Users } from "lucide-react";
import { analyzeFood, generateRecipe, getKitchenItems, addKitchenItem, deleteKitchenItem } from "../api";

export default function SmartKitchen() {
  const [tab, setTab] = useState("recipe");

  /* ---------- Recipe generator ---------- */
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------- Pantry ---------- */
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [pantryError, setPantryError] = useState("");

  useEffect(() => {
    getKitchenItems().then(setItems).catch((e) => setPantryError(e.message));
  }, []);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const usePantry = () => {
    const names = items.map((i) => i.name).filter(Boolean);
    if (!names.length) { setError("Your pantry is empty. Add items in the Pantry tab."); return; }
    setError("");
    setText((p) => (p ? p.trim() + ", " : "I have ") + names.join(", "));
  };

  const generate = async () => {
    setError("");
    setRecipe(null);
    setLoading(true);
    try {
      let dish = "";
      if (file) {
        try {
          const a = await analyzeFood(file, text);
          if (a && a.food) dish = String(a.food).replace(/_/g, " ");
        } catch { /* photo is optional, keep going */ }
      }
      if (!text.trim() && !dish) {
        setError("Couldn't recognise the photo. Describe the dish or ingredients instead.");
        return;
      }
      setRecipe(await generateRecipe(text, dish));
    } catch (e) {
      setError(e.message || "Recipe generation failed");
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    if (!name.trim()) return;
    setPantryError("");
    try {
      setItems(await addKitchenItem(name.trim(), expiry));
      setName("");
      setExpiry("");
    } catch (e) { setPantryError(e.message); }
  };

  const remove = async (id) => {
    try { setItems(await deleteKitchenItem(id)); } catch (e) { setPantryError(e.message); }
  };

  const badge = (i) => {
    const d = i.days_left;
    if (typeof d !== "number") return { text: i.status || "", cls: "" };
    if (d < 0) return { text: "Expired", cls: "bad" };
    if (d <= 2) return { text: `${d}d left`, cls: "warn" };
    return { text: `${d}d left`, cls: "ok" };
  };

  return (
    <div className="sk-page">
      <div className="sk-tabs">
        <button className={tab === "recipe" ? "on" : ""} onClick={() => setTab("recipe")}>Recipe Generator</button>
        <button className={tab === "pantry" ? "on" : ""} onClick={() => setTab("pantry")}>
          Pantry{items.length > 0 && <em>{items.length}</em>}
        </button>
      </div>

      {tab === "recipe" && (
        <>
          <div className="sk-hero">
            <div className="sk-chef"><ChefHat size={26} /></div>
            <h1>Smart Recipe Generator</h1>
            <p>Describe your ingredients or upload a photo to get a full recipe.</p>
          </div>

          <div className="sk-card">
            <div className="sk-cols">
              <div>
                <label className="sk-lbl"><Type size={11} /> DESCRIBE DISH / INGREDIENTS</label>
                <textarea
                  className="sk-text"
                  placeholder="e.g. I have chicken, rice, and tomatoes. What can I make?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {items.length > 0 && (
                  <button type="button" className="sk-link" onClick={usePantry}>+ Use my pantry items</button>
                )}
              </div>
              <div>
                <label className="sk-lbl"><Upload size={11} /> UPLOAD IMAGE</label>
                <label className="sk-drop">
                  {preview ? (
                    <img src={preview} alt="preview" className="sk-preview" />
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Click to Upload Photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files[0])} />
                </label>
              </div>
            </div>

            <div className="sk-actions">
              <button className="sk-btn" onClick={generate} disabled={loading || (!text.trim() && !file)}>
                {loading ? <><Loader2 size={15} className="spin" /> Cooking up a recipe...</> : <>Generate Recipe <ArrowRight size={15} /></>}
              </button>
            </div>
            {error && <p className="fl-err" style={{ textAlign: "center" }}>{error}</p>}
          </div>

          {recipe && (
            <div className="sk-result">
              <h2>{recipe.title}</h2>
              {(recipe.time || recipe.servings) && (
                <div className="sk-meta">
                  {recipe.time && <span><Clock size={13} /> {recipe.time}</span>}
                  {recipe.servings && <span><Users size={13} /> Serves {recipe.servings}</span>}
                </div>
              )}
              {recipe.raw ? (
                <pre className="sk-raw">{recipe.raw}</pre>
              ) : (
                <div className="sk-rcols">
                  <div>
                    <h4>Ingredients</h4>
                    <ul>{recipe.ingredients.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                  <div>
                    <h4>Steps</h4>
                    <ol>{recipe.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
                  </div>
                </div>
              )}
              {recipe.tips && <p className="sk-tip">Tip: {recipe.tips}</p>}
            </div>
          )}
        </>
      )}

      {tab === "pantry" && (
        <>
          <div className="sk-hero">
            <div className="sk-chef"><ChefHat size={26} /></div>
            <h1>Kitchen Pantry</h1>
            <p>Track what you have and when it expires.</p>
          </div>

          <div className="sk-card">
            <div className="sk-add">
              <input className="sk-input" placeholder="Item (e.g. Milk)" value={name}
                     onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
              <input className="sk-input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              <button className="sk-btn sm" onClick={add}><Plus size={14} /> Add</button>
            </div>
            {pantryError && <p className="fl-err">{pantryError}</p>}

            {items.length === 0 ? (
              <p className="sk-empty">No items yet. Add something above.</p>
            ) : (
              <ul className="sk-list">
                {items.map((i) => {
                  const b = badge(i);
                  return (
                    <li key={i.id}>
                      <div>
                        <b>{i.name}</b>
                        <span>{i.expiry ? `Expires ${i.expiry}` : "No expiry date"}</span>
                      </div>
                      {b.text && <em className={"sk-badge " + b.cls}>{b.text}</em>}
                      <button className="sk-del" onClick={() => remove(i.id)} aria-label="Delete"><Trash2 size={14} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}