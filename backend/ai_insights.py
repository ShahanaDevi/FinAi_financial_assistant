import os
from typing import List, Optional

try:
    from google import genai
except Exception:  # pragma: no cover - optional dependency in dev
    genai = None


# WHY: lazy-init the client so missing API keys don't break non-AI flows.
def _get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not genai:
        return None
    return genai.Client(api_key=api_key)


# WHY: allow minimal AI usage without breaking existing behavior (default = always).
def _resolve_ai_mode(request_mode: Optional[str]) -> str:
    env_mode = (os.getenv("AI_MODE") or "").strip().lower()
    if request_mode:
        return request_mode.strip().lower()
    if env_mode:
        return env_mode
    return "always"


def generate_insights(
    metrics: dict,
    conversation: list,
    language: str = "en",
    ai_mode: Optional[str] = None,
) -> str:
    """
    Conversational AI for financial insights with safe local fallback.
    """

    # -----------------------------
    # LANGUAGE INSTRUCTION
    # -----------------------------
    if language == "hi":
        lang_instr = "Respond ONLY in Hindi. Use simple language for Indian SME owners."
    elif language == "ta":
        lang_instr = "Respond ONLY in Tamil. Use simple Tamil for Indian SME owners."
    else:
        lang_instr = "Respond ONLY in English. Use simple language."

    ai_mode = _resolve_ai_mode(ai_mode)
    if ai_mode == "off":
        # WHY: explicit off mode avoids any external API usage.
        return _local_insights(metrics, language)

    # -----------------------------
    # SYSTEM PROMPT
    # -----------------------------
    system_prompt = f"""
You are an AI financial advisor for Indian SMEs.

{lang_instr}

Financial Summary:
- Revenue: ₹{metrics.get("revenue")}
- Expenses: ₹{metrics.get("expenses")}
- Profit Margin: {metrics.get("profit_margin")}%
- Cash Flow: ₹{metrics.get("cash_flow")}
- Creditworthiness: {metrics.get("creditworthiness")}
- Risks: {metrics.get("risks")}
"""

    # -----------------------------
    # BUILD CONVERSATION FOR GEMINI
    # -----------------------------
    conversation_lines = []
    for msg in conversation or []:
        role = "User" if msg.get("role") == "user" else "Assistant"
        conversation_lines.append(f"{role}: {msg.get('text', '')}")
    conversation_text = "\n".join(conversation_lines)

    # -----------------------------
    # AUTO MODE: ONLY CALL AI WHEN NEEDED
    # -----------------------------
    if ai_mode == "auto" and not _should_call_ai(metrics, conversation or []):
        # WHY: avoid spend when the user hasn't asked for guidance.
        return _local_insights(metrics, language)

    client = _get_gemini_client()
    if not client:
        # WHY: fallback if API key is missing or quota is exceeded.
        return _local_insights(metrics, language)

    # -----------------------------
    # GEMINI API CALL
    # -----------------------------
    try:
        model_name = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model_name,
            contents=(
                f"{system_prompt}\n\n"
                "Conversation:\n"
                f"{conversation_text}\n\n"
                "Please respond clearly with actionable guidance."
            ),
            config={"temperature": 0.4, "max_output_tokens": 700},
        )
        return (response.text or "").strip()
    except Exception as exc:
        # WHY: never crash the API due to external provider failures.
        if (os.getenv("AI_DEBUG_LOG") or "").strip().lower() in {"1", "true", "yes"}:
            print("AI_DEBUG_LOG: Gemini call failed:", repr(exc))
        return _local_insights(metrics, language)


def _should_call_ai(metrics: dict, messages: List[dict]) -> bool:
    user_text = " ".join(
        msg.get("text", "") for msg in messages if msg.get("role") == "user"
    ).lower()
    if any(token in user_text for token in ["?", "advice", "suggest", "recommend", "help"]):
        return True
    risks = metrics.get("risks") or []
    if isinstance(risks, list) and any(risk != "No major financial risks detected" for risk in risks):
        return True
    return False


def _local_insights(metrics: dict, language: str) -> str:
    # WHY: simple deterministic fallback that is cheap and safe.
    revenue = metrics.get("revenue")
    expenses = metrics.get("expenses")
    profit_margin = metrics.get("profit_margin")
    cash_flow = metrics.get("cash_flow")
    creditworthiness = metrics.get("creditworthiness")
    risks = metrics.get("risks") or []

    if language == "hi":
        return (
            f"संक्षिप्त वित्तीय सारांश:\n"
            f"- राजस्व: ₹{revenue}\n"
            f"- खर्च: ₹{expenses}\n"
            f"- लाभ मार्जिन: {profit_margin}%\n"
            f"- नकदी प्रवाह: ₹{cash_flow}\n"
            f"- क्रेडिट क्षमता: {creditworthiness}\n"
            f"- जोखिम: {', '.join(risks)}\n"
            f"यदि आप सलाह चाहते हैं, कृपया अपना प्रश्न पूछें।"
        )
    if language == "ta":
        return (
            f"சுருக்கமான நிதி சுருக்கம்:\n"
            f"- வருவாய்: ₹{revenue}\n"
            f"- செலவுகள்: ₹{expenses}\n"
            f"- லாப விகிதம்: {profit_margin}%\n"
            f"- நிகர பணப்பாய்ச்சி: ₹{cash_flow}\n"
            f"- கடன் தகுதி: {creditworthiness}\n"
            f"- ஆபத்துகள்: {', '.join(risks)}\n"
            f"ஆலோசனை வேண்டுமெனில் உங்கள் கேள்வியை எழுதுங்கள்."
        )

    return (
        "Quick financial summary:\n"
        f"- Revenue: ₹{revenue}\n"
        f"- Expenses: ₹{expenses}\n"
        f"- Profit Margin: {profit_margin}%\n"
        f"- Cash Flow: ₹{cash_flow}\n"
        f"- Creditworthiness: {creditworthiness}\n"
        f"- Risks: {', '.join(risks)}\n"
        "If you want detailed guidance, ask a specific question."
    )


def check_ai_health() -> dict:
    # WHY: lightweight health check to confirm Gemini connectivity and configuration.
    client = _get_gemini_client()
    if not client:
        return {"status": "fallback", "reason": "Gemini client not configured"}
    try:
        model_name = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model_name,
            contents="Return only the word OK.",
            config={"temperature": 0.0, "max_output_tokens": 5},
        )
        text = (response.text or "").strip()
        if text.lower().startswith("ok"):
            return {"status": "ok"}
        return {"status": "fallback", "reason": f"Unexpected response: {text}"}
    except Exception as exc:
        return {"status": "fallback", "reason": repr(exc)}
