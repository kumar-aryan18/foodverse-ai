import { NavLink, Outlet } from "react-router-dom";
import { LayoutGrid, ScanLine, Thermometer, ShieldCheck, ChefHat, CalendarDays, Soup } from "lucide-react";

const links = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/food-recognition", label: "Food Recognition", icon: ScanLine },
  { to: "/freshness-detector", label: "Freshness Detector", icon: Thermometer },
  { to: "/hygiene-monitor", label: "Hygiene Monitor", icon: ShieldCheck },
  { to: "/smart-kitchen", label: "Smart Kitchen", icon: ChefHat },
  { to: "/meal-planner", label: "Meal Planner", icon: CalendarDays },
];

export default function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Soup size={18} /></div>
          FoodVerse
        </div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
        <div className="status">
          System Status <b>● Online</b>
          <div className="bar" />
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}