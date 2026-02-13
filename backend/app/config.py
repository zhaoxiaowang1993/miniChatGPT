"""应用配置，从环境变量加载"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """应用配置"""
    # DeepSeek API
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    
    # 数据库
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./minichatgpt.db"
    )
    
    # 应用
    APP_TITLE: str = "MiniChatGPT API"
    APP_VERSION: str = "0.1.0"


settings = Settings()
