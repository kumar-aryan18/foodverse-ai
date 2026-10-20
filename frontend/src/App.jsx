import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Overview from "./pages/Overview";
import FoodRecognition from "./pages/FoodRecognition";
import FreshnessDetector from "./pages/FreshnessDetector";
import Hygiene from "./pages/Hygiene";
import SmartKitchen from "./pages/SmartKitchen";
import MealPlanner from "./pages/MealPlanner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/food-recognition" element={<FoodRecognition />} />
          <Route path="/freshness-detector" element={<FreshnessDetector />} />
          <Route path="/hygiene-monitor" element={<Hygiene />} />
          <Route path="/smart-kitchen" element={<SmartKitchen />} />
          <Route path="/meal-planner" element={<MealPlanner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}