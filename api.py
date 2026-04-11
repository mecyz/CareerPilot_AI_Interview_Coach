import os
import shutil
import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import src.llm as llm
import src.analysis as analysis
import src.stt as stt

load_dotenv()

app = FastAPI(title="AI Interview Coach API")

# Setup CORS for the React Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class QuestionRequest(BaseModel):
    job_desc: str
    history: List[Dict[str, Any]]

class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    transcript: Optional[str] = None
    duration_seconds: float = 60.0

class StarCheckRequest(BaseModel):
    text: Optional[str] = None
    transcript: Optional[str] = None

class ReportRequest(BaseModel):
    analyses: List[Dict[str, Any]]
    transcripts: List[str]

# --- Endpoints ---

@app.post("/api/question")
@app.post("/api/generate-question")  # Aliased to safely match our frontend logic
async def generate_question(req: QuestionRequest):
    return llm.generate_question(req.job_desc, req.history)

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Save uploaded audio blobs temporarily
    ext = ".webm" if "webm" in file.filename else ".wav"
    temp_path = f"temp_audio_{uuid.uuid4().hex}{ext}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        transcript = stt.transcribe_audio_file(temp_path)
        return {"transcript": transcript}
    finally:
        # Wipe the audio buffer on completion
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/analyze")
async def analyze_transcript(req: AnalyzeRequest):
    text = req.transcript or req.text or ""
    return analysis.full_analysis(text, req.duration_seconds)

@app.post("/api/star-check")
@app.post("/api/check-star")  # Aliased to safely match our frontend logic
async def star_check(req: StarCheckRequest):
    text = req.transcript or req.text or ""
    return llm.check_star_method(text)

@app.post("/api/session-report")
async def session_report(req: ReportRequest):
    # Fetch parallel summary details
    llm_report = llm.get_overall_feedback(req.analyses, req.transcripts)
    nlp_report = analysis.aggregate_session(req.analyses)
    
    # Merge both structures. Conflicting keys resolve to LLM precedence due to unpacking order.
    return {**nlp_report, **llm_report}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
