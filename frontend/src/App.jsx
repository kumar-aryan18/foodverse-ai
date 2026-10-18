import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FoodRecognition from './pages/FoodRecognition';
import FreshnessDetector from './pages/FreshnessDetector';
import MealPlanner from './pages/MealPlanner';
import Hygiene from './pages/Hygiene';
import SmartKitchen from './pages/SmartKitchen';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<FoodRecognition />} />
        <Route path="/food-recognition" element={<FoodRecognition />} />
        <Route path="/freshness-detector" element={<FreshnessDetector />} />
        <Route path="/hygiene-monitor" element={<Hygiene />} />
        <Route path="/kitchen-assistant" element={<SmartKitchen />} />
        <Route path="/smart-kitchen" element={<SmartKitchen />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
      </Routes>
    </Layout>
  );
}