import { useState, useRef } from "react";
import { Upload, Mic, Type, Activity, UtensilsCrossed, Loader2 } from "lucide-react";
import { analyzeFood, transcribeAudio } from "../api";

const pretty = (k) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const fmt = (v) =>
  v === null || v === undefined ? "-"
  : Array.isArray(v) ? v.join(" to ")
  : typeof v === "object" ? Object.entries(v).map(([a, b]) => `${a}: ${b}`).join(", ")
  : String(v);

export default function FoodRecognition() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [desc, setDesc] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef(null);
  const chunks = useRef([]);
  const stopRequested = useRef(false);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  /* ---------- Voice: record -> Whisper on backend -> description box ---------- */
  const startRec = async () => {
    if (recording || transcribing) return;
    setVoiceError("");
    stopRequested.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        mediaRef.current = null;
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 1500) {
          setVoiceError("Too short. Hold the button while you speak.");
          return;
        }
        setTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob);
          if (text) setDesc((p) => (p ? p.trim() + " " : "") + text);
          else setVoiceError("Couldn't hear anything. Try again, closer to the mic.");
        } catch (e) {
          console.error(e);
          setVoiceError("Transcription failed. Is the backend running with faster-whisper installed?");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      if (stopRequested.current) mr.stop();
    } catch {
      setVoiceError("Microphone permission denied or not available.");
    }
  };

  const stopRec = () => {
    stopRequested.current = true;
    const mr = mediaRef.current;
    if (mr && mr.state === "recording") mr.stop();
  };

  /* ---------- Analyze ---------- */
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await analyzeFood(file, desc));
    } catch (e) {
      console.error(e);
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Result helpers ---------- */
  const r = result;
  const hs = r?.health_score;
  const score = hs && typeof hs === "object" ? (hs.score ?? hs.value ?? hs.health_score) : hs;
  const note = hs && typeof hs === "object" ? (hs.label ?? hs.note ?? hs.message ?? hs.verdict) : null;
  const scoreNum = Number(score);
  const scoreColor = scoreNum >= 70 ? "#34d399" : scoreNum >= 40 ? "#fbbf24" : "#f87171";
  const nutrition = r?.nutrition && typeof r.nutrition === "object" ? r.nutrition : null;

  return (
    <div className="fl-page">
      <div className="fl-left">
        <h1 className="fl-title">multimodal Food Lens ✨</h1>
        <p className="fl-sub">Combine Image + Voice + Text for the most accurate nutrition AI.</p>

        <label
          className="fl-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files[0]); }}
        >
          {preview ? (
            <img src={preview} alt="preview" className="fl-preview" />
          ) : (
            <>
              <div className="fl-upicon"><Upload size={22} /></div>
              <b>Upload Food Image</b>
              <span>Drag &amp; drop or Click to browse</span>
            </>
          )}
          <input type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files[0])} />
        </label>

        <div className="fl-context">
          <div className="fl-ctx-title"><Activity size={13} /> ADD CONTEXT (OPTIONAL)</div>
          <div className="fl-ctx-row">
            <button
              type="button"
              className={"fl-rec" + (recording ? " on" : "")}
              onPointerDown={startRec}
              onPointerUp={stopRec}
              onPointerLeave={stopRec}
              onPointerCancel={stopRec}
              disabled={transcribing}
            >
              <span className="fl-mic">
                {transcribing ? <Loader2 size={16} className="spin" /> : <Mic size={16} />}
              </span>
              {recording ? "LISTENING..." : transcribing ? "TRANSCRIBING..." : "HOLD TO RECORD"}
            </button>

            <div className="fl-desc">
              <label><Type size={11} /> DESCRIPTION / GOALS</label>
              <textarea placeholder="what is this?" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
          </div>
          {voiceError && <p className="fl-err">{voiceError}</p>}
        </div>

        <button className="fl-analyze" disabled={!file || loading} onClick={analyze}>
          {loading ? <><Loader2 size={16} className="spin" /> Analyzing...</> : "Analyze Meal"}
        </button>
        {error && <p className="fl-err">{error}</p>}
      </div>

      <div className="fl-right">
        {r && !r.food ? (
          <div className="fl-result">
            <h2 className="fl-dish">Not sure</h2>
            <p className="fl-conf">Confidence: {(r.confidence * 100).toFixed(1)}%</p>
            <p className="fl-note">{r.message}</p>
          </div>
        ) : r ? (
          <div className="fl-result">
            <h2 className="fl-dish">{String(r.food).replace(/_/g, " ")}</h2>
            <p className="fl-conf">
              Confidence: {(r.confidence * 100).toFixed(1)}%
              {r.source === "description" && " · identified from your description"}
            </p>

            {nutrition && (
              <div className="fl-grid">
                {Object.entries(nutrition).map(([k, v]) => (
                  <div key={k} className="fl-cell">
                    <span>{pretty(k)}</span>
                    <b>{fmt(v)}</b>
                  </div>
                ))}
              </div>
            )}

            {Number.isFinite(scoreNum) && (
              <div className="fl-score">
                <div className="fl-score-top">
                  <span>Health score</span>
                  <b style={{ color: scoreColor }}>{scoreNum}/100</b>
                </div>
                <div className="fl-bar"><i style={{ width: `${Math.min(100, scoreNum)}%`, background: scoreColor }} /></div>
                {note && <p className="fl-note">{note}</p>}
              </div>
            )}

            <p className="fl-disc">Estimates only. Portion size and hidden ingredients affect real values.</p>
          </div>
        ) : (
          <div className="fl-empty">
            <UtensilsCrossed size={64} />
            <h3>Ready to Analyze</h3>
            <p>Upload a photo and optionally add voice notes to generate nutrition insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}