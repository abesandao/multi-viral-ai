"""Gemini API の接続テスト。400 エラーの詳細を確認する。"""
import os
import sys

# backend をパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

key = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
if not key:
    print("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY が .env に設定されていません")
    sys.exit(1)

print("API キー:", key[:8] + "..." + key[-4:] if len(key) > 12 else "***")
print()

# 1. REST API で直接テスト
print("=== REST API 直接呼び出し ===")
import requests

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
payload = {
    "contents": [{"parts": [{"text": "Hello, respond with: OK"}]}],
    "generationConfig": {"maxOutputTokens": 100},
}

resp = requests.post(url, json=payload, timeout=30)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:500]}")
if resp.status_code == 200:
    try:
        data = resp.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        print(f"\n成功! 応答: {text}")
    except Exception as e:
        print(f"パースエラー: {e}")
else:
    try:
        err = resp.json().get("error", {})
        print(f"エラーコード: {err.get('code')}")
        print(f"メッセージ: {err.get('message')}")
        print(f"詳細: {err.get('status')}")
    except Exception:
        pass
    print("\n→ 400 の場合: 地域制限の可能性。Google AI Studio で課金を有効にしてください。")
    print("  https://aistudio.google.com → API keys → Enable billing")
