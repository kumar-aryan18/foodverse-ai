import io
import os
import tempfile
import wave

import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()
_model = None


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel("base", device="cpu", compute_type="int8")
    return _model


def _wav_to_array(data: bytes) -> np.ndarray:
    """Decode 16-bit PCM WAV bytes to a float32 mono 16 kHz array (no ffmpeg/av needed)."""
    with wave.open(io.BytesIO(data), "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        frames = w.readframes(w.getnframes())
    if sw != 2:
        raise ValueError("Expected 16-bit WAV audio")
    audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        audio = audio.reshape(-1, ch).mean(axis=1)
    if sr != 16000:
        n = int(len(audio) * 16000 / sr)
        audio = np.interp(np.linspace(0, len(audio) - 1, n), np.arange(len(audio)), audio).astype(np.float32)
    return audio


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio")

    model = _get_model()
    try:
        try:
            audio = _wav_to_array(data)
            segments, _ = model.transcribe(audio, beam_size=1, language="en")
        except (wave.Error, EOFError):
            # Not a WAV (e.g. mp4 from the /docs page): fall back to file decoding, which needs a working `av`
            suffix = os.path.splitext(file.filename or "")[1] or ".webm"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
                f.write(data)
                path = f.name
            try:
                segments, _ = model.transcribe(path, beam_size=1)
                segments = list(segments)
            finally:
                os.remove(path)
        text = " ".join(s.text.strip() for s in segments).strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    return {"text": text}