import { useState } from 'react'
import { analyzeFood } from '../api'

const pretty = (s) => s.replaceAll('_', ' ')

export default function FoodRecognition() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function onPick(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError('')
  }

  async function onAnalyze() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      setResult(await analyzeFood(file))
    } catch (e) {
      setError(e.message === 'Failed to fetch'
        ? 'Cannot reach the backend. Is uvicorn running?'
        : e.message)
    } finally {
      setLoading(false)
    }
  }

  const n = result?.nutrition

  return (
    <div>
      <h1>Food Recognition</h1>
      <p className="muted">
        Upload a photo of a meal to get the dish, estimated nutrition and a health score.
      </p>

      <input type="file" accept="image/*" onChange={onPick} />
      {preview && <img className="preview" src={preview} alt="Selected food" />}
      <div>
        <button onClick={onAnalyze} disabled={!file || loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="card">
          <h2>{pretty(result.prediction.dish)}</h2>
          <p>Confidence: {(result.prediction.confidence * 100).toFixed(1)}%</p>
          {result.note && <p className="warn">{result.note}</p>}

          <h3>Nutrition (about {n.serving_g} g)</h3>
          <p>
            {n.calories_kcal} kcal (estimate: {n.calories_range[0]} to {n.calories_range[1]})
          </p>
          <p>Protein {n.protein_g} g · Carbs {n.carbs_g} g · Fat {n.fat_g} g</p>

          <h3>Health score: {result.health.score}/100</h3>
          <p>{result.health.label}</p>

          <h3>Other possibilities</h3>
          <ul>
            {result.top3.map((t) => (
              <li key={t.dish}>
                {pretty(t.dish)}: {(t.confidence * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
          <p className="muted">
            Estimates only. Portion size and hidden ingredients affect real values.
          </p>
        </div>
      )}
    </div>
  )
}