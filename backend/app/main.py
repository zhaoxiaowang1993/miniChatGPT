"""FastAPI 应用入口"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import chat, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时初始化数据库"""
    init_db()
    yield
    # 关闭时可选清理逻辑


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS 配置，允许前端跨域访问
app.include_router(chat.router)
app.include_router(sessions.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite 默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "MiniChatGPT API", "version": settings.APP_VERSION}


@app.get("/api/health")
def health():
    return {"status": "ok"}
