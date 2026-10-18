import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FoodRecognition from './pages/FoodRecognition';
import FreshnessDetector from './pages/FreshnessDetector';
import MealPlanner from './pages/MealPlanner';
import Hygiene from './pages/Hygiene';

function Placeholder({ title }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="muted">Coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Placeholder title="Overview" />} />
        <Route path="/food-recognition" element={<FoodRecognition />} />
        <Route path="/freshness-detector" element={<FreshnessDetector />} />
        <Route path="/hygiene-monitor" element={<Hygiene />} />
        <Route path="/kitchen-assistant" element={<Placeholder title="Smart Kitchen" />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
      </Routes>
    </Layout>
  );
}
