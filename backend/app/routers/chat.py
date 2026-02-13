"""Chat 流式对话 API"""
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DBSession

from app.database import get_db, SessionLocal
from app.schemas.chat import ChatRequest
from app.services.llm_service import build_messages_for_api, stream_chat
from app.services.session_service import (
    create_session,
    get_messages,
    messages_to_api_format,
    add_message,
    update_session_title_from_message,
    get_session,
)

router = APIRouter(prefix="/api", tags=["chat"])


def sse_line(data: dict) -> bytes:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


@router.post("/chat")
def chat_stream(req: ChatRequest, db: DBSession = Depends(get_db)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message 不能为空")

    session_id = req.session_id
    if session_id is None:
        s = create_session(db)
        session_id = s.id
    else:
        s = get_session(db, session_id)
        if not s:
            raise HTTPException(status_code=404, detail="会话不存在")

    messages = get_messages(db, session_id)
    api_messages = messages_to_api_format(messages)
    api_messages.append({"role": "user", "content": req.message.strip()})

    # 若为首条消息，用其更新会话标题
    new_title = None
    if len(messages) == 0:
        update_session_title_from_message(db, session_id, req.message.strip())
        t = req.message.strip()
        new_title = (t[:30] + "…") if len(t) > 30 else (t or "新对话")

    # 先持久化用户消息
    add_message(db, session_id, "user", req.message.strip())

    reasoning = ""
    content = ""

    def generate():
        nonlocal reasoning, content
        try:
            for chunk in stream_chat(api_messages, req.thinking_mode):
                if chunk["type"] == "reasoning":
                    reasoning += chunk["data"]
                elif chunk["type"] == "content":
                    content += chunk["data"]
                if chunk["type"] == "done" and new_title is not None:
                    yield sse_line({"type": "session_title", "data": new_title})
                yield sse_line(chunk)
        except Exception as e:
            err = str(e)
            if "401" in err or "invalid" in err.lower() or "api_key" in err.lower():
                err = "API Key 无效或未配置，请检查 .env 中的 DEEPSEEK_API_KEY"
            elif "429" in err or "rate" in err.lower() or "limit" in err.lower():
                err = "请求过于频繁或 Token 已达上限，请稍后重试"
            elif "500" in err or "503" in err.lower():
                err = "DeepSeek 服务暂时不可用，请稍后重试"
            yield sse_line({"type": "content", "data": f"[错误] {err}"})
            yield sse_line({"type": "done", "data": ""})
        else:
            db2 = SessionLocal()
            try:
                add_message(db2, session_id, "assistant", content, reasoning if reasoning else None)
            finally:
                db2.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
