import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a senior technical recruiter conducting a professional job interview.

Your rules:
- Ask ONE question at a time
- Base questions on the job description provided
- Vary between behavioral, situational, and technical questions
- Build on the candidate's previous answers
- Keep questions concise and clear
- Do not give feedback or commentary, just ask the next question
- Start with a warm introduction on the first message only"""


def generate_question(job_desc: str, history: list) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Job Description:\n{job_desc}"},
    ]
    messages.extend(history)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )
        content = response.choices[0].message.content
        return {
            "question": content,
            "tips": "Consider using the STAR method for behavioral questions if applicable."
        }
    except Exception as e:
        print(f"Error in generate_question: {e}")
        return {
            "error": str(e),
            "question": "Could you please elaborate more on your background and experience?",
            "tips": ""
        }


def check_star_method(transcript: str) -> dict:
    prompt = f"""Analyze this interview answer and check if it follows the STAR method.
    
Answer: {transcript}

Respond in this exact format:
Situation: yes or no
Task: yes or no  
Action: yes or no
Result: yes or no
Feedback: one sentence tip to improve"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        
        raw = response.choices[0].message.content
        star_flags = {"situation": False, "task": False, "action": False, "result": False}
        feedback = ""
        
        for line in raw.splitlines():
            line_lower = line.lower()
            if line_lower.startswith("situation:"):
                star_flags["situation"] = "yes" in line_lower
            elif line_lower.startswith("task:"):
                star_flags["task"] = "yes" in line_lower
            elif line_lower.startswith("action:"):
                star_flags["action"] = "yes" in line_lower
            elif line_lower.startswith("result:"):
                star_flags["result"] = "yes" in line_lower
            elif line_lower.startswith("feedback:"):
                # split on the first colon in case feedback has colons
                parts = line.split(":", 1)
                if len(parts) > 1:
                    feedback = parts[1].strip()

        score_components = sum(1 for v in star_flags.values() if v)
        score = int((score_components / 4.0) * 10)

        return {
            "score": score,
            "feedback": feedback if feedback else "Keep practicing the STAR format.",
            "star_breakdown": star_flags
        }
    except Exception as e:
        print(f"Error in check_star_method: {e}")
        return {
            "error": str(e),
            "score": 0,
            "feedback": "Failed to analyze answer.",
            "star_breakdown": {"situation": False, "task": False, "action": False, "result": False}
        }


def get_overall_feedback(analyses: list, transcripts: list) -> dict:
    if not transcripts:
        return {
            "overall_score": 0,
            "strengths": [],
            "improvements": ["No transcripts provided."],
            "summary": "No interview data available to evaluate."
        }

    context = ""
    for i, (t, a) in enumerate(zip(transcripts, analyses)):
        context += f"\nAnswer {i+1}: {t}\nAnalysis {i+1}: {json.dumps(a)}\n"

    prompt = f"""You are an expert interview coach evaluating a complete interview session.
Review the candidate's answers and their individual STAR method evaluations:
{context}

Respond ONLY with a valid JSON object matching this exact schema:
{{
  "overall_score": <int between 0 and 100>,
  "strengths": ["list", "of", "strong", "points"],
  "improvements": ["list", "of", "areas", "to", "improve"],
  "summary": "a short summary paragraph"
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error in get_overall_feedback: {e}")
        return {
            "error": str(e),
            "overall_score": 0,
            "strengths": [],
            "improvements": ["Error evaluating interview performance."],
            "summary": "An API error occurred during the overall evaluation."
        }