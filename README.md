# MiniChatGPT

类似 ChatGPT 的 AI 对话 Web 产品，采用 React + FastAPI + SQLite + DeepSeek 技术栈。

## 技术栈

- **大模型**：DeepSeek
- **前端**：React + Vite + TypeScript
- **后端**：Python + FastAPI
- **数据库**：SQLite

## 快速开始

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env     # 编辑 .env 填入 DEEPSEEK_API_KEY
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

前端通过 Vite 代理将 `/api` 转发到 `http://127.0.0.1:8000`，需先启动后端。

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
MiniChatGPT/
├── backend/           # FastAPI 后端
│   ├── app/
│   │   ├── main.py    # 入口
│   │   ├── config.py  # 配置
│   │   ├── models/    # 数据模型
│   │   ├── routers/   # API 路由
│   │   ├── schemas/   # 请求/响应模型
│   │   └── services/  # 业务逻辑
│   └── requirements.txt
├── frontend/          # React 前端
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── stores/
└── README.md
```
