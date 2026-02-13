# DeepSeek API 接口规范（测试记录）

基于 `test_deepseek_api.py` 实际调用记录，用于后端实现与前端对接。

## 接入方式

- **模型**：`deepseek-chat`（统一使用）
- **思考模式**：`extra_body={"thinking": {"type": "enabled"}}`
- **Base URL**：`https://api.deepseek.com`

## 1. 非流式响应结构

```json
{
  "response_id": "864ef63a-4a64-472a-81a7-2f452cab1f3b",
  "model": "deepseek-chat",
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 6,
    "total_tokens": 20
  },
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "1+1等于2。",
        "reasoning_content": null
      }
    }
  ]
}
```

- `reasoning_content`：非思考模式下为 `null` 或无此字段
- `finish_reason`：常见为 `"stop"`

## 2. 流式 Chunk 结构（非思考模式）

- 首个 chunk：`delta.role = "assistant"`，`content`、`reasoning_content` 多为空
- 后续 chunk：`delta.content` 逐字输出，`reasoning_content` 为空
- `chunk_id` 同一轮内相同

## 3. 流式 Chunk 结构（思考模式）

- 先流式输出 `delta.reasoning_content`（思维链）
- 再流式输出 `delta.content`（最终回答）
- 同一 chunk 内 `reasoning_content` 与 `content` 互斥，不同时非空

## 4. 多轮对话规范

- 下一轮仅拼接上一轮的 `content`，不拼接 `reasoning_content`
- `messages` 格式：
  ```python
  messages.append({"role": "assistant", "content": content})  # 仅 content
  messages.append({"role": "user", "content": "新问题"})
  ```

## 5. 后端 SSE 输出建议（供前端解析）

前端期望的流式 chunk 格式：`{ "type": "reasoning"|"content"|"done", "data": "..." }`

- `reasoning`：思维链片段
- `content`：回答片段
- `done`：结束标记，`data` 可为空

后端需按此格式包装 DeepSeek 的 `delta.reasoning_content` 与 `delta.content`，以 SSE 或 JSON Lines 形式下发。
