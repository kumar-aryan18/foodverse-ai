import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Video, Mic, Square, Loader2, Eye, FileText } from "lucide-react";
import { getHygieneChecklist, scoreHygiene, transcribeAudio } from "../api";

/* >>> If your old page sent a different body to /hygiene-score, change this line <<< */
const buildPayload = (checkedIds) => ({ checked: checkedIds });

const pretty = (k) => String(k).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const fmt = (v) =>
  v === null || v === undefined ? "-"
  : Array.isArray(v) ? (v.length ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(", ") : "None")
  : typeof v === "object" ? Object.entries(v).map(([a, b]) => `${pretty(a)}: ${b}`).join(", ")
  : String(v);

/* Accepts {group: [items]}, [{title, items}], or a flat list */
function normalize(data) {
  const toItem = (x, i) =>
    typeof x === "string"
      ? { id: x, label: x }
      : { id: x.id ?? x.key ?? x.name ?? x.label ?? String(i), label: x.label ?? x.text ?? x.name ?? x.item ?? String(x.id ?? i) };
  if (Array.isArray(data)) {
    if (data.length && typeof data[0] === "object" && Array.isArray(data[0].items))
      return data.map((g) => ({ title: g.title ?? g.category ?? g.name ?? g.group ?? "Checks", items: g.items.map(toItem) }));
    return [{ title: "Checklist", items: data.map(toItem) }];
  }
  if (data && typeof data === "object")
    return Object.entries(data).map(([title, items]) => ({ title, items: (Array.isArray(items) ? items : []).map(toItem) }));
  return [];
}

export default function Hygiene() {
  const [groups, setGroups] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [loadError, setLoadError] = useState("");

  const [media, setMedia] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);

  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRef = useRef(null);
  const chunks = useRef([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getHygieneChecklist()
      .then((d) => setGroups(normalize(d)))
      .catch((e) => setLoadError(e.message));
  }, []);

  const pickMedia = (f) => {
    if (!f) return;
    setMedia(f);
    setMediaUrl(URL.createObjectURL(f));
  };

  const toggle = (id) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  /* ---------- Audio surveillance: tap to start / tap to stop ---------- */
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
        if (blob.size < 1500) { setVoiceError("Too short. Tap, speak, then tap again."); return; }
        setTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob);
          if (text) setNotes((p) => (p ? p.trim() + " " : "") + text);
          else setVoiceError("Couldn't hear anything. Try again.");
        } catch (e) {
          console.error(e);
          setVoiceError("Voice transcription unavailable. You can type notes instead.");
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

  /* ---------- Run inspection ---------- */
  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await scoreHygiene(buildPayload([...checked])));
    } catch (e) {
      console.error(e);
      setError(e.message || "Inspection failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Result helpers (any response shape) ---------- */
  const r = result && typeof result === "object" ? result : null;
  const scoreKey = r && ["score", "hygiene_score", "percent", "percentage", "total"].find((k) => typeof r[k] === "number");
  const scoreVal = scoreKey ? r[scoreKey] : null;
  const scoreColor = scoreVal === null ? "#60a5fa" : scoreVal >= 70 ? "#34d399" : scoreVal >= 40 ? "#fbbf24" : "#f87171";
  const rest = r ? Object.entries(r).filter(([k]) => k !== scoreKey) : [];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="hy-page">
      <div className="hy-left">
        <h1 className="hy-title"><ShieldCheck size={22} /> Hygiene &amp; Safety Monitor</h1>
        <p className="hy-sub">AI-powered surveillance for kitchen compliance and safety risks.</p>

        <label className="hy-video">
          {mediaUrl ? (
            media?.type?.startsWith("video")
              ? <video src={mediaUrl} controls className="hy-media" />
              : <img src={mediaUrl} alt="footage" className="hy-media" />
          ) : (
            <>
              <Video size={44} />
              <span>Upload CCTV Footage or Image</span>
            </>
          )}
          <input type="file" accept="image/*,video/*" hidden onChange={(e) => pickMedia(e.target.files[0])} />
        </label>

        <div className="hy-row">
          <div className="hy-card">
            <h3 className="hy-h"><Mic size={13} /> Audio Surveillance</h3>
            <button type="button" className={"hy-audio" + (recording ? " on" : "")} onClick={toggleRec} disabled={transcribing}>
              {transcribing ? <Loader2 size={14} className="spin" /> : recording ? <Square size={12} /> : <Mic size={14} />}
              {recording ? "Stop Recording" : transcribing ? "Transcribing..." : "Record Kitchen Audio"}
            </button>
            <textarea
              className="hy-notes"
              placeholder="Transcribed audio or manual notes appear here"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {voiceError && <p className="fl-err">{voiceError}</p>}
          </div>

          <div className="hy-card">
            <h3 className="hy-h"><FileText size={13} /> Compliance Rules
              {total > 0 && <em className="hy-count">{checked.size}/{total}</em>}
            </h3>
            <div className="hy-rules">
              {loadError && <p className="fl-err">{loadError}. Is the backend running?</p>}
              {groups.map((g) => (
                <div key={g.title} className="hy-group">
                  <b>{g.title}</b>
                  {g.items.map((it) => (
                    <label key={it.id} className="hy-check">
                      <input type="checkbox" checked={checked.has(it.id)} onChange={() => toggle(it.id)} />
                      <span>{it.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="hy-run" onClick={run} disabled={loading || groups.length === 0}>
          {loading ? <><Loader2 size={16} className="spin" /> Inspecting...</> : "Run AI Inspection"}
        </button>
        {error && <p className="fl-err">{error}</p>}
      </div>

      <aside className="hy-insights">
        <div className="hy-ins-head">
          <b>LIVE INSIGHTS</b>
          <i className={"hy-dot" + (r ? " on" : "")} />
        </div>

        {r ? (
          <div className="hy-ins-body">
            {scoreVal !== null && (
              <div className="hy-score">
                <div className="hy-score-top"><span>Hygiene score</span><b style={{ color: scoreColor }}>{scoreVal}{scoreVal <= 100 ? "/100" : ""}</b></div>
                <div className="fl-bar"><i style={{ width: `${Math.min(100, scoreVal)}%`, background: scoreColor }} /></div>
              </div>
            )}
            {rest.map(([k, v]) => (
              <div key={k} className="hy-item">
                <span>{pretty(k)}</span>
                <b>{fmt(v)}</b>
              </div>
            ))} 
          </div>
        ) : (
          <div className="hy-ins-empty">
            <Eye size={34} />
            <p>Monitoring Inactive.<br />Tick the rules and run the inspection.</p>
          </div>
        )}
      </aside>
    </div>
  );
}