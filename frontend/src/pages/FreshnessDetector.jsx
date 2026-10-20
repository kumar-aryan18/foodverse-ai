import { useState, useRef } from "react";
import { Thermometer, Search, Mic, Square, Loader2, Info } from "lucide-react";
import { checkFreshness, transcribeAudio } from "../api";

const pretty = (k) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const fmt = (v) =>
  v === null || v === undefined ? "-"
  : Array.isArray(v) ? v.join(", ")
  : typeof v === "object" ? Object.entries(v).map(([a, b]) => `${pretty(a)}: ${b}`).join(", ")
  : String(v);

export default function FreshnessDetector() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [storedFor, setStoredFor] = useState("");
  const [storage, setStorage] = useState("Room Temp");
  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef(null);
  const chunks = useRef([]);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  /* ---------- Tap mic to start, tap again to stop ---------- */
  const toggleRec = async () => {
    if (transcribing) return;

    if (recording) {
      const mr = mediaRef.current;
      if (mr && mr.state === "recording") mr.stop();
      return;
    }

    setVoiceError("");
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
        if (blob.size < 1500) { setVoiceError("Too short. Tap the mic and speak, then tap again."); return; }
        setTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob);
          if (text) setNotes((p) => (p ? p.trim() + " " : "") + text);
          else setVoiceError("Couldn't hear anything. Try again.");
        } catch (e) {
          console.error(e);
          setVoiceError("Voice transcription unavailable. You can type your notes instead.");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setVoiceError("Microphone permission denied or not available.");
    }
  };

  /* ---------- Check freshness ---------- */
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await checkFreshness(file, { storedFor, storage, notes }));
    } catch (e) {
      console.error(e);
      setError(e.message || "Freshness check failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Result helpers (works with any response shape) ---------- */
  const r = result && typeof result === "object" ? result : null;
  const headKey = r && ["label", "status", "verdict", "freshness", "result", "prediction", "category"].find((k) => r[k] !== undefined);
  const headline = headKey ? fmt(r[headKey]) : null;
  const confKey = r && ["confidence", "score", "freshness_score"].find((k) => typeof r[k] === "number");
  let conf = confKey ? r[confKey] : null;
  if (conf !== null && conf <= 1) conf = conf * 100;
  const rest = r ? Object.entries(r).filter(([k]) => k !== headKey && k !== confKey) : [];

  return (
    <div className="fd-page">
      <div className="fd-left">
        <h1 className="fd-title"><Thermometer size={24} /> AI Freshness Detector</h1>
        <p className="fd-sub">Detect spoilage early using multimodal vision &amp; sensory analysis.</p>

        <div className="fd-card">
          <h3 className="fd-h">1. Visual Check</h3>
          <label
            className="fd-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files[0]); }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="fd-preview" />
            ) : (
              <>
                <Search size={30} />
                <span>Upload Photo of Food</span>
              </>
            )}
            <input type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files[0])} />
          </label>
        </div>

        <div className="fd-card">
          <h3 className="fd-h">2. Context &amp; Sensory Data <Info size={12} className="fd-info" /></h3>
          <div className="fd-row">
            <div>
              <label className="fd-lbl">STORED FOR</label>
              <input className="fd-input" placeholder="e.g. 3 days" value={storedFor}
                     onChange={(e) => setStoredFor(e.target.value)} />
            </div>
            <div>
              <label className="fd-lbl">STORAGE TYPE</label>
              <select className="fd-input" value={storage} onChange={(e) => setStorage(e.target.value)}>
                <option>Room Temp</option>
                <option>Fridge</option>
                <option>Freezer</option>
              </select>
            </div>
          </div>

          <label className="fd-lbl" style={{ marginTop: 16 }}>DESCRIBE SMELL / TEXTURE (OPTIONAL)</label>
          <div className="fd-voice">
            <button
              type="button"
              className={"fd-mic" + (recording ? " on" : "")}
              onClick={toggleRec}
              disabled={transcribing}
              aria-label="Tap to record"
            >
              {transcribing ? <Loader2 size={16} className="spin" /> : recording ? <Square size={14} /> : <Mic size={16} />}
            </button>
            <input
              className="fd-notes"
              placeholder={recording ? "Listening... tap the mic again to stop" : transcribing ? "Transcribing..." : "Tap mic to add voice notes"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {voiceError && <p className="fl-err">{voiceError}</p>}
        </div>

        <button className="fd-btn" disabled={!file || loading} onClick={analyze}>
          {loading ? <><Loader2 size={16} className="spin" /> Checking...</> : "Check Freshness"}
        </button>
        {error && <p className="fl-err">{error}</p>}
      </div>

      <div className="fd-right">
        {r ? (
          <div className="fd-result">
            {headline && <h2 className="fl-dish">{headline}</h2>}
            {conf !== null && <p className="fl-conf">Confidence: {conf.toFixed(1)}%</p>}
            {rest.length > 0 && (
              <div className="fl-grid">
                {rest.map(([k, v]) => (
                  <div key={k} className="fl-cell">
                    <span>{pretty(k)}</span>
                    <b>{fmt(v)}</b>
                  </div>
                ))}
              </div>
            )}
            <p className="fl-disc">Visual estimate only. Always check smell and texture before eating.</p>
          </div>
        ) : (
          <div className="fd-empty">
            <Thermometer size={52} />
            <h3>Ready to Analyze</h3>
            <p>Upload an image and provide context to get a multimodal freshness report.</p>
          </div>
        )}
      </div>
    </div>
  );
}