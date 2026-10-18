import { useState } from 'react'
import { checkFreshness } from '../api'

export default function FreshnessDetector() {
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

  async function onCheck() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      setResult(await checkFreshness(file))
    } catch (e) {
      setError(e.message === 'Failed to fetch'
        ? 'Cannot reach the backend. Is uvicorn running?'
        : e.message)
    } finally {
      setLoading(false)
    }
  }

  const state = result?.state
const heading =
  state === 'fresh' ? 'Looks fresh'
  : state === 'rotten' ? 'Looks spoiled'
  : 'Not sure'
const color =
  state === 'fresh' ? '#34d399'
  : state === 'rotten' ? '#f87171'
  : '#94a3b8'

  return (
    <div>
      <h1>Freshness Detector</h1>
      <p className="muted">
        Upload a photo of an apple, banana or orange to check how fresh it looks.
      </p>
      <input type="file" accept="image/*" onChange={onPick} />
      {preview && <img className="preview" src={preview} alt="Selected produce" />}
      <div>
        <button onClick={onCheck} disabled={!file || loading}>
          {loading ? 'Checking...' : 'Check freshness'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="card">
         <h2 style={{ color }}>{heading}</h2>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <p>{result.recommendation}</p>
          <p className="muted">{result.disclaimer}</p>
        </div>
      )}
    </div>
  )
}