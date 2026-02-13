"""DeepSeek LLM 服务：流式对话，支持思考模式"""
from typing import List, Dict, Generator
from openai import OpenAI

from app.config import settings


def get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )


def build_messages_for_api(session_messages: List[dict]) -> List[Dict]:
    """
    构建发送给 DeepSeek 的 messages。
    多轮对话仅拼接 content，不拼接 reasoning_content（按官方规范）。
    """
    return [{"role": m["role"], "content": m["content"] or ""} for m in session_messages]


def stream_chat(messages: List[dict], thinking_mode: bool) -> Generator:
    """
    流式调用 DeepSeek，yield SSE 格式 chunk: {"type": "reasoning"|"content"|"done", "data": "..."}
    """
    client = get_client()
    extra = {"thinking": {"type": "enabled"}} if thinking_mode else None

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body=extra,
    )

    for chunk in response:
        delta = chunk.choices[0].delta
        rc = getattr(delta, "reasoning_content", None) or ""
        c = getattr(delta, "content", None) or ""

        if rc:
            yield {"type": "reasoning", "data": rc}
        if c:
            yield {"type": "content", "data": c}

    yield {"type": "done", "data": ""}
