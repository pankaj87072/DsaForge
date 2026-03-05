"""
AI Connector Service
====================
Generic AI provider connector. To add a new AI tool in the future:
1. Add its config to AI_PROVIDERS dict
2. Add a handler function following the pattern below
3. Call connect_ai(provider, token) - no other changes needed.
"""

import httpx
from typing import Optional
import os

# ─── Provider Registry ────────────────────────────────────────────────────────
# Add new AI providers here. That's all you need to do for basic support.
AI_PROVIDERS = {
    "claude": {
        "name": "Claude (Anthropic)",
        "verify_url": "https://api.anthropic.com/v1/messages",
        "verify_method": "POST",
        "auth_header": "x-api-key",
        "verify_payload": {
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "hi"}]
        },
        "success_status": [200],
        "headers": {"anthropic-version": "2023-06-01"},
        "chat_handler": "claude_chat"
    },
    "openai": {
        "name": "ChatGPT (OpenAI)",
        "verify_url": "https://api.openai.com/v1/chat/completions",
        "verify_method": "POST",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "verify_payload": {
            "model": "gpt-3.5-turbo",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "hi"}]
        },
        "success_status": [200],
        "headers": {},
        "chat_handler": "openai_chat"
    },
    "gemini": {
        "name": "Gemini (Google)",
        "verify_url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        "verify_method": "POST",
        "auth_header": None,  # uses query param
        "auth_query_param": "key",
        "verify_payload": {
            "contents": [{"parts": [{"text": "hi"}]}],
            "generationConfig": {"maxOutputTokens": 10}
        },
        "success_status": [200],
        "headers": {"Content-Type": "application/json"},
        "chat_handler": "gemini_chat"
    },
    # ── Future providers: just add an entry here ──────────────────────────────
    # "mistral": { ... },
    # "cohere":  { ... },
    # "groq":    { ... },
}

# ─── Generic Connection Verifier ──────────────────────────────────────────────
async def verify_connection(provider: str, token: str) -> dict:
    """Generic verifier. Works for any registered provider."""
    config = AI_PROVIDERS.get(provider)
    if not config:
        return {"success": False, "error": f"Unknown provider: {provider}"}

    headers = {**config.get("headers", {}), "Content-Type": "application/json"}
    params = {}

    if config.get("auth_header"):
        prefix = config.get("auth_prefix", "")
        headers[config["auth_header"]] = f"{prefix}{token}"
    elif config.get("auth_query_param"):
        params[config["auth_query_param"]] = token

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                config["verify_url"],
                headers=headers,
                json=config["verify_payload"],
                params=params
            )
        if resp.status_code in config["success_status"]:
            return {"success": True, "provider": provider, "name": config["name"]}
        elif resp.status_code == 401:
            return {"success": False, "error": "Invalid API token"}
        elif resp.status_code == 429:
            return {"success": False, "error": "Rate limit hit — token likely valid but quota exceeded"}
        else:
            return {"success": False, "error": f"API returned {resp.status_code}"}
    except httpx.TimeoutException:
        return {"success": False, "error": "Connection timed out"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ─── Generic Chat Dispatcher ──────────────────────────────────────────────────
async def chat_with_ai(provider: str, token: str, prompt: str, system: str = "") -> str:
    """Send a prompt to any registered AI provider. Returns response text."""
    handler_name = AI_PROVIDERS.get(provider, {}).get("chat_handler")
    handlers = {
        "claude_chat": _claude_chat,
        "openai_chat": _openai_chat,
        "gemini_chat": _gemini_chat,
    }
    handler = handlers.get(handler_name)
    if not handler:
        raise ValueError(f"No chat handler for provider: {provider}")
    return await handler(token, prompt, system)


async def _claude_chat(token: str, prompt: str, system: str) -> str:
    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 800,
        "messages": [{"role": "user", "content": prompt}]
    }
    if system:
        payload["system"] = system
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": token, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
            json=payload
        )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"]


async def _openai_chat(token: str, prompt: str, system: str) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"model": "gpt-3.5-turbo", "max_tokens": 800, "messages": messages}
        )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


async def _gemini_chat(token: str, prompt: str, system: str) -> str:
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={token}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"maxOutputTokens": 800}
            }
        )
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def get_providers_list():
    return [{"id": k, "name": v["name"]} for k, v in AI_PROVIDERS.items()]
