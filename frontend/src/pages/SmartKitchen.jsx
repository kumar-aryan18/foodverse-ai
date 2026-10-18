import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const COLORS = { expired: "#e5484d", use_soon: "#f5a524", fresh: "#30a46c" };
const LABELS = { expired: "Expired", use_soon: "Use soon", fresh: "Fresh" };

export default function SmartKitchen() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch(`${API_URL}/kitchen/items`);
      setItems(await res.json());
    } catch {
      setError("Could not load items. Is the backend running?");
    }
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim() || !expiry) {
      setError("Enter an item name and an expiry date.");
      return;
    }
    setError("");
    try {
      const res = await fetch(`${API_URL}/kitchen/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiry }),
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
      setName(""); setExpiry("");
    } catch {
      setError("Could not add the item.");
    }
  }

  async function remove(id) {
    const res = await fetch(`${API_URL}/kitchen/items/${id}`, { method: "DELETE" });
    setItems(await res.json());
  }

  const expiredCount = items.filter((i) => i.state === "expired").length;
  const soonCount = items.filter((i) => i.state === "use_soon").length;

  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <h2>Smart Kitchen Inventory</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Item (e.g. Milk)" value={name}
               onChange={(e) => setName(e.target.value)} />
        <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        <button onClick={add}>Add item</button>
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {(expiredCount > 0 || soonCount > 0) && (
        <p style={{ marginTop: 14 }}>
          ⚠️ {expiredCount} expired, {soonCount} expiring within 2 days
        </p>
      )}

      {items.length === 0 && <p style={{ marginTop: 14 }}>No items yet. Add something above.</p>}

      {items.map((i) => (
        <div key={i.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b>{i.name}</b>
            <span style={{ background: COLORS[i.state], color: "white", borderRadius: 12, padding: "2px 10px", fontSize: 13 }}>
              {LABELS[i.state]}
            </span>
          </div>
          <small>
            Expires {i.expiry} (
            {i.days_left < 0 ? `${-i.days_left} days ago` : `${i.days_left} days left`})
          </small>
          <p style={{ margin: "6px 0", fontSize: 14 }}>💡 {i.tip}</p>
          <button onClick={() => remove(i.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}