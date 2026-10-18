import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/food-recognition', label: 'Food Recognition' },
  { path: '/freshness-detector', label: 'Freshness Detector' },
  { path: '/hygiene-monitor', label: 'Hygiene Monitor' },
  { path: '/kitchen-assistant', label: 'Smart Kitchen' },
  { path: '/meal-planner', label: 'Meal Planner' },
]

export default function Layout({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <h2>🍽️ FoodVerse AI</h2>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) => (isActive ? 'nav active' : 'nav')}
          >
            {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}