import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import FoodRecognition from './pages/FoodRecognition'

function Placeholder({ title }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="muted">Coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Placeholder title="Overview" />} />
        <Route path="/food-recognition" element={<FoodRecognition />} />
        <Route path="/freshness-detector" element={<Placeholder title="Freshness Detector" />} />
        <Route path="/hygiene-monitor" element={<Placeholder title="Hygiene Monitor" />} />
        <Route path="/kitchen-assistant" element={<Placeholder title="Smart Kitchen" />} />
        <Route path="/meal-planner" element={<Placeholder title="Meal Planner" />} />
      </Routes>
    </Layout>
  )
}
