"""
DeepSeek API 测试脚本
用于验证输入输出规范，记录接口返回字段，供前端对接参考。
API Key 从 .env 或环境变量 DEEPSEEK_API_KEY 加载。
运行：python test_deepseek_api.py（需在 backend 目录，确保 .env 存在）
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
import json

load_dotenv()

API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

if not API_KEY:
    raise ValueError("请设置环境变量 DEEPSEEK_API_KEY 或在 backend/.env 中配置")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)


def test_non_streaming_no_thinking():
    """测试 1：非流式 + 非思考模式 (deepseek-chat)"""
    print("\n" + "=" * 60)
    print("测试 1：非流式 + 非思考模式")
    print("=" * 60)

    messages = [{"role": "user", "content": "1+1等于几？用一句话回答。"}]
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=False,
    )

    choice = response.choices[0]
    msg = choice.message

    # 记录返回结构
    result = {
        "response_id": response.id,
        "model": response.model,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else None,
            "completion_tokens": response.usage.completion_tokens if response.usage else None,
            "total_tokens": response.usage.total_tokens if response.usage else None,
        },
        "choices": [
            {
                "index": choice.index,
                "finish_reason": choice.finish_reason,
                "message": {
                    "role": msg.role,
                    "content": msg.content,
                    "reasoning_content": getattr(msg, "reasoning_content", None),  # 非思考模式通常为 None
                },
            }
        ],
    }
    print("返回结构 (JSON):")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print("\n实际 content:", msg.content)
    print("reasoning_content:", getattr(msg, "reasoning_content", "无此字段"))
    return result


def test_streaming_no_thinking():
    """测试 2：流式 + 非思考模式 (deepseek-chat)"""
    print("\n" + "=" * 60)
    print("测试 2：流式 + 非思考模式")
    print("=" * 60)

    messages = [{"role": "user", "content": "2+2等于几？用一句话回答。"}]
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
    )

    reasoning_content = ""
    content = ""
    chunk_samples = []

    for i, chunk in enumerate(response):
        delta = chunk.choices[0].delta
        rc = getattr(delta, "reasoning_content", None) or ""
        c = getattr(delta, "content", None) or ""

        if rc:
            reasoning_content += rc
        if c:
            content += c

        # 记录前 3 个 chunk 结构
        if i < 3:
            chunk_samples.append({
                "chunk_id": chunk.id,
                "model": chunk.model,
                "choices[0].index": chunk.choices[0].index if chunk.choices else None,
                "choices[0].delta": {
                    "role": getattr(delta, "role", None),
                    "content": c or "(空)",
                    "reasoning_content": rc or "(空)",
                },
                "choices[0].finish_reason": chunk.choices[0].finish_reason if chunk.choices else None,
            })

    print("Chunk 结构示例 (前 3 个):")
    print(json.dumps(chunk_samples, ensure_ascii=False, indent=2))
    print("\n汇总: reasoning_content 长度:", len(reasoning_content), "| content 长度:", len(content))
    print("content 内容:", content[:200] + "..." if len(content) > 200 else content)
    return {"reasoning_content": reasoning_content, "content": content}


def test_streaming_with_thinking():
    """测试 3：流式 + 思考模式 (deepseek-chat + extra_body)"""
    print("\n" + "=" * 60)
    print("测试 3：流式 + 思考模式 (deepseek-chat + extra_body)")
    print("=" * 60)

    messages = [{"role": "user", "content": "9.11 和 9.8，哪个更大？"}]
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body={"thinking": {"type": "enabled"}},
    )

    reasoning_content = ""
    content = ""
    chunk_samples = []

    for i, chunk in enumerate(response):
        delta = chunk.choices[0].delta
        rc = getattr(delta, "reasoning_content", None) or ""
        c = getattr(delta, "content", None) or ""

        if rc:
            reasoning_content += rc
        if c:
            content += c

        if i < 5:
            chunk_samples.append({
                "chunk_id": chunk.id,
                "choices[0].delta.reasoning_content": rc[:50] + "..." if len(rc) > 50 else (rc or "(空)"),
                "choices[0].delta.content": c[:50] + "..." if len(c) > 50 else (c or "(空)"),
            })

    print("Chunk 结构示例 (前 5 个):")
    print(json.dumps(chunk_samples, ensure_ascii=False, indent=2))
    print("\nreasoning_content 长度:", len(reasoning_content))
    print("reasoning_content 预览:", reasoning_content[:300] + "..." if len(reasoning_content) > 300 else reasoning_content)
    print("\ncontent 长度:", len(content))
    print("content 内容:", content[:300] + "..." if len(content) > 300 else content)
    return {"reasoning_content": reasoning_content, "content": content}


def test_streaming_with_thinking_multiturn():
    """测试 4：流式 + 思考模式 + 多轮对话 (Turn 2)"""
    print("\n" + "=" * 60)
    print("测试 4：流式 + 思考模式 + 多轮对话")
    print("=" * 60)

    # Turn 1
    messages = [{"role": "user", "content": "9.11 和 9.8，哪个更大？"}]
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body={"thinking": {"type": "enabled"}},
    )

    reasoning_content = ""
    content = ""
    for chunk in response:
        delta = chunk.choices[0].delta
        rc = getattr(delta, "reasoning_content", None) or ""
        c = getattr(delta, "content", None) or ""
        if rc:
            reasoning_content += rc
        if c:
            content += c

    print("Turn 1 reasoning 长度:", len(reasoning_content))
    print("Turn 1 content:", content[:150])

    # Turn 2: 仅 append assistant 的 content，不 append reasoning_content
    messages.append({"role": "assistant", "content": content})
    messages.append({"role": "user", "content": "strawberry 这个词里有几个 R？"})

    response2 = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body={"thinking": {"type": "enabled"}},
    )

    reasoning_content2 = ""
    content2 = ""
    for chunk in response2:
        delta = chunk.choices[0].delta
        rc = getattr(delta, "reasoning_content", None) or ""
        c = getattr(delta, "content", None) or ""
        if rc:
            reasoning_content2 += rc
        if c:
            content2 += c

    print("\nTurn 2 reasoning 长度:", len(reasoning_content2))
    print("Turn 2 content:", content2[:200])
    return {"turn1": {"reasoning": reasoning_content, "content": content}, "turn2": {"reasoning": reasoning_content2, "content": content2}}


def main():
    print("\nDeepSeek API 接口测试")
    print("=" * 60)

    try:
        test_non_streaming_no_thinking()
    except Exception as e:
        print("测试 1 异常:", e)

    try:
        test_streaming_no_thinking()
    except Exception as e:
        print("测试 2 异常:", e)

    try:
        test_streaming_with_thinking()
    except Exception as e:
        print("测试 3 异常:", e)

    try:
        test_streaming_with_thinking_multiturn()
    except Exception as e:
        print("测试 4 异常:", e)

    print("\n" + "=" * 60)
    print("测试完成。以上为 DeepSeek API 返回字段记录。")
    print("=" * 60)


if __name__ == "__main__":
    main()
