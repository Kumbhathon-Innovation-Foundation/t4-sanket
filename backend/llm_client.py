"""
ANUBHAV Unified LLM Client
Uses official modern Google GenAI SDK (google.genai) with Groq / xAI fallback.
Handles single-turn synthesis and tool-use orchestration with immediate 429 failover.
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("anubhav.llm_client")

env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")

# 1. Initialize Google GenAI Client
_gemini_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize google.genai Client: {e}")

# 2. Initialize Groq / OpenAI-compatible Client (disabling internal retry delays)
_groq_client = None
_groq_model = "qwen/qwen3.8-27b"
if GROQ_API_KEY:
    try:
        from openai import OpenAI
        if os.getenv("XAI_API_KEY") and not os.getenv("GROQ_API_KEY"):
            _groq_client = OpenAI(base_url="https://api.x.ai/v1", api_key=GROQ_API_KEY, max_retries=1)
            _groq_model = "grok-2-latest"
        else:
            _groq_client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY, max_retries=1)
            _groq_model = "qwen/qwen3.8-27b"
    except Exception as e:
        logger.warning(f"Failed to initialize Groq/xAI client: {e}")

def _strip_thinking_tags(text: str) -> str:
    """Strips <think>...</think> tags if reasoning model is used."""
    if not text:
        return ""
    if "</think>" in text:
        return text.split("</think>")[-1].strip()
    return text.strip()

def call_llm_synthesis(prompt: str, system_prompt: str = "") -> Dict[str, Any]:
    """
    Executes a fast, single-turn LLM synthesis request.
    Tries Gemini (gemini-3.6-flash) first. If 429 quota/rate limit is hit,
    immediately fails over to Groq without blocking or long retry delays.
    """
    # 1. Try Gemini
    if _gemini_client:
        try:
            resp = _gemini_client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
                config={"system_instruction": system_prompt} if system_prompt else None
            )
            raw_text = getattr(resp, "text", "") or ""
            logger.info("[LLM] Request served successfully by Gemini (gemini-3.6-flash)")
            return {
                "text": raw_text.strip(),
                "provider": "Gemini (gemini-3.6-flash)"
            }
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"[LLM Fallback Triggered] Gemini error ({err_msg[:120]}...). Immediately falling back to Groq/xAI...")

    # 2. Fallback to Groq
    if _groq_client:
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            resp = _groq_client.chat.completions.create(
                model=_groq_model,
                messages=messages,
                max_tokens=1000
            )
            raw_text = resp.choices[0].message.content or ""
            clean_text = _strip_thinking_tags(raw_text)
            logger.info(f"[LLM] Request served successfully by Groq ({_groq_model})")
            return {
                "text": clean_text,
                "provider": f"Groq ({_groq_model})"
            }
        except Exception as ge:
            logger.error(f"[LLM Groq Error] {ge}")

    # 3. If both APIs are temporarily rate-limited, provide grounded template
    return {
        "text": "",
        "provider": "Offline Fallback"
    }
