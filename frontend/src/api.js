const API_BASE = 'http://localhost:8000';

export async function analyzeFood(file, description = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', description);

  const res = await fetch(`${API_BASE}/analyze-food`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return await res.json();
}

// Convert any recorded audio (webm/ogg/mp4) to 16 kHz mono 16-bit WAV in the browser
async function blobToWav16k(blob) {
  const arrayBuf = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  ctx.close();

  const length = Math.max(1, Math.ceil(decoded.duration * 16000));
  const off = new OfflineAudioContext(1, length, 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  const samples = rendered.getChannelData(0);

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);       // PCM
  view.setUint16(22, 1, true);       // mono
  view.setUint32(24, 16000, true);   // sample rate
  view.setUint32(28, 32000, true);   // byte rate
  view.setUint16(32, 2, true);       // block align
  view.setUint16(34, 16, true);      // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export async function transcribeAudio(blob) {
  let upload = blob;
  let name = 'note.webm';
  try {
    upload = await blobToWav16k(blob);
    name = 'note.wav';
  } catch (e) {
    console.warn('WAV conversion failed, sending original audio', e);
  }

  const formData = new FormData();
  formData.append('file', upload, name);

  const res = await fetch(`${API_BASE}/transcribe`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Transcription failed');
  }
  return await res.json(); // { text: "..." }
}
export async function checkFreshness(file, ctx = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('stored_for', ctx.storedFor || '');
  formData.append('storage', ctx.storage || '');
  formData.append('notes', ctx.notes || '');

  const res = await fetch(`${API_BASE}/check-freshness`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return await res.json();
}

// Fallback exports in case other pages import them
export async function getHygieneChecklist() {
  const res = await fetch(`${API_BASE}/hygiene-checklist`);
  if (!res.ok) throw new Error(`Could not load checklist (${res.status})`);
  return await res.json();
}

export async function scoreHygiene(payload) {
  const res = await fetch(`${API_BASE}/hygiene-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail || err) || `Request failed (${res.status})`);
  }
  return await res.json();
}

export async function askSmartKitchen(query) {
  const res = await fetch(`${API_BASE}/smart-kitchen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return await res.json();
}

export async function getMealPlan(preferences) {
  const res = await fetch(`${API_BASE}/meal-planner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  return await res.json();
}
async function readError(res, fallback) {
  const err = await res.json().catch(() => ({}));
  if (typeof err.detail === 'string') return err.detail;
  if (Array.isArray(err.detail))
    return err.detail.map((d) => `${(d.loc || []).slice(-1)[0]}: ${d.msg}`).join('; ');
  return fallback;
}

export async function getKitchenItems() {
  const res = await fetch(`${API_BASE}/kitchen/items`);
  if (!res.ok) throw new Error(await readError(res, 'Could not load pantry'));
  return await res.json();
}

export async function addKitchenItem(name, expiry) {
  const res = await fetch(`${API_BASE}/kitchen/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, expiry }),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not add item'));
  return await res.json(); // full updated list
}

export async function deleteKitchenItem(id) {
  const res = await fetch(`${API_BASE}/kitchen/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readError(res, 'Could not delete item'));
  return await res.json(); // full updated list
}

export async function generateRecipe(ingredients, dish = '') {
  const res = await fetch(`${API_BASE}/recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, dish }),
  });
  if (!res.ok) throw new Error(await readError(res, `Request failed (${res.status})`));
  return await res.json();
}
export async function generateAIMealPlan(profile) {
  const res = await fetch(`${API_BASE}/ai-meal-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(await readError(res, `Request failed (${res.status})`));
  return await res.json();
}