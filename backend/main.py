import logging
import os
from dotenv import load_dotenv

# .env を backend フォルダから確実に読み込む
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, generate

app = FastAPI(title="Multi-Viral AI API", version="0.1.0")

# CORS: ローカル + Vercel (*.vercel.app)
_cors_origins = [
    "http://localhost:3000", "http://localhost:3001", "http://localhost:3002",
    "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel の全デプロイ
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(generate.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Multi-Viral AI API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(os.environ.get("PORT", 8001))
    print(f"Starting server at http://localhost:{port}  (docs: http://localhost:{port}/docs)")
    # 設定確認
    if os.environ.get("GEMINI_API_KEY"):
        print("  [AI] Gemini API: 設定済み（キーが期限切れの場合はダミーにフォールバック）")
    elif os.environ.get("ANTHROPIC_API_KEY"):
        print("  [AI] Claude API: 設定済み")
    else:
        print("  [AI] ダミーモード（GEMINI_API_KEY を設定すると実AIが使えます）")
    uvicorn.run(app, host="0.0.0.0", port=port)
