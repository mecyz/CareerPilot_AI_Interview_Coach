import os
from faster_whisper import WhisperModel

print("Loading Whisper model...")
try:
    MODEL = WhisperModel("base", device="cpu", compute_type="int8")
    print("Model ready.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    MODEL = None

def transcribe(wav_path: str) -> str:
    """
    Legacy transcribe function, preserved for backwards compatibility.
    """
    return transcribe_audio_file(wav_path)

def transcribe_audio_file(filepath: str) -> str:
    """
    Transcribe an audio file (.wav, .webm, etc.) using faster-whisper.
    Returns the transcript string, or an empty string on failure.
    """
    if MODEL is None:
        print("Whisper model is not initialized.")
        return ""
        
    if not os.path.exists(filepath):
        print(f"Audio file not found: {filepath}")
        return ""
        
    try:
        print(f"Transcribing: {filepath}...")
        segments, _ = MODEL.transcribe(filepath, beam_size=5)
        transcript = " ".join(segment.text.strip() for segment in segments)
        print(f"Transcript: {transcript}")
        return transcript
    except Exception as e:
        print(f"Transcription failed: {e}")
        return ""