import re
from collections import Counter
from textblob import TextBlob

FILLER_WORDS = [
    "um", "uh", "like", "actually", "basically",
    "you know", "sort of", "kind of", "right", "okay so"
]

def count_fillers(text: str) -> tuple[int, dict]:
    text_lower = text.lower()
    counts = {}
    total = 0

    for word in FILLER_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            counts[word] = len(matches)
            total += len(matches)

    return total, counts

def get_sentiment_label(polarity: float) -> str:
    if polarity >= 0.2:
        return "positive"
    elif polarity <= -0.1:
        return "negative"
    else:
        return "neutral"

def get_pace_label(wpm: float) -> str:
    if wpm < 110:
        return "slow"
    elif wpm > 160:
        return "fast"
    else:
        return "good"

def full_analysis(text: str, duration_seconds: float) -> dict:
    if duration_seconds <= 0:
        duration_seconds = 1.0  # Prevent division by zero
        
    filler_count, fillers = count_fillers(text)
    
    blob = TextBlob(text)
    sentiment = float(blob.sentiment.polarity)
    
    words = len(text.split())
    pace_wpm = (words / duration_seconds) * 60.0
    
    return {
        "fillers": fillers,
        "filler_count": filler_count,
        "sentiment": round(sentiment, 3),
        "sentiment_label": get_sentiment_label(sentiment),
        "pace_wpm": round(pace_wpm, 1),
        "pace_label": get_pace_label(pace_wpm),
        "word_count": words
    }

def aggregate_session(analyses: list[dict]) -> dict:
    if not analyses:
        return {
            "avg_sentiment": 0.0,
            "avg_pace_wpm": 0.0,
            "total_fillers": 0,
            "top_fillers": [],
            "session_score": 0
        }
        
    total_sentiment = sum(a.get("sentiment", 0.0) for a in analyses)
    total_pace = sum(a.get("pace_wpm", 0.0) for a in analyses)
    total_fillers = sum(a.get("filler_count", 0) for a in analyses)
    
    all_fillers = Counter()
    for a in analyses:
        all_fillers.update(a.get("fillers", {}))
        
    top_fillers = [word for word, _ in all_fillers.most_common(3)]
    
    avg_sentiment = total_sentiment / len(analyses)
    avg_pace_wpm = total_pace / len(analyses)
    
    # Scoring computation
    # Sentiment (0-100) -> 40%
    sentiment_score = ((avg_sentiment + 1) / 2) * 100
    
    # Pace (0-100) -> 60%
    pace_score = 100.0
    if avg_pace_wpm < 110:
        pace_score -= (110 - avg_pace_wpm) * 1.5
    elif avg_pace_wpm > 160:
        pace_score -= (avg_pace_wpm - 160) * 1.5
    pace_score = max(0.0, min(100.0, pace_score))
    
    # Filler penalty (deducts up to 30 points based on filler ratio)
    total_words = sum(a.get("word_count", 0) for a in analyses)
    filler_penalty = 0.0
    if total_words > 0:
        filler_ratio = total_fillers / total_words
        filler_penalty = min(30.0, filler_ratio * 400.0) 
        
    final_score = int(round((sentiment_score * 0.4) + (pace_score * 0.6) - filler_penalty))
    final_score = max(0, min(100, final_score))
    
    return {
        "avg_sentiment": round(avg_sentiment, 3),
        "avg_pace_wpm": round(avg_pace_wpm, 1),
        "total_fillers": total_fillers,
        "top_fillers": top_fillers,
        "session_score": final_score
    }