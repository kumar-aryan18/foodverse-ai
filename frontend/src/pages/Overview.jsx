import { Link } from "react-router-dom";
import { ScanLine, Thermometer, ShieldCheck, ChefHat, CalendarDays } from "lucide-react";

const modules = [
  { to: "/food-recognition",  title: "Food Recognition",   desc: "Identify dishes & nutrition", icon: ScanLine,     bg: "#10b981" },
  { to: "/freshness-detector", title: "Freshness Detector", desc: "Detect spoilage instantly",   icon: Thermometer,  bg: "#f97316" },
  { to: "/hygiene-monitor",   title: "Hygiene Monitor",    desc: "Kitchen compliance AI",       icon: ShieldCheck,  bg: "#3b82f6" },
  { to: "/smart-kitchen",     title: "Smart Kitchen",      desc: "Real-time cooking aid",       icon: ChefHat,      bg: "#6366f1" },
  { to: "/meal-planner",      title: "Meal Planner",       desc: "Personalized diet plans",     icon: CalendarDays, bg: "#06b6d4" },
];

export default function Overview() {
  return (
    <div className="ov-wrap">
      <section className="ov-hero">
        <h1>Welcome to <span>FoodVerse AI</span></h1>
        <p>A unified multimodal AI platform revolutionizing the food lifecycle from farm to fork.</p>
        <span className="ov-badge">Real-time Analysis</span>

        {/* faint pulse line on the right, like the reference */}
        <svg className="ov-pulse" viewBox="0 0 300 160" fill="none">
          <path d="M0 110 H80 L120 10 L170 150 L200 100 H300"
                stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </section>

      <div className="ov-grid">
        {modules.map(({ to, title, desc, icon: Icon, bg }) => (
          <Link key={to} to={to} className="ov-card">
            <div className="ov-icon" style={{ background: bg }}><Icon size={20} color="#fff" /></div>
            <h3>{title}</h3>
            <p>{desc}</p>
            <span className="ov-launch">LAUNCH MODULE →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}