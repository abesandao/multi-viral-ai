"""Gemini API キーの診断。「期限切れ」の本当の原因を特定する。"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

key = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()

print("=== Gemini API キー診断 ===\n")

# 1. キーの読み込み確認
if not key:
    print("ERROR: GEMINI_API_KEY が .env に設定されていません")
    sys.exit(1)

print(f"キー長: {len(key)} 文字")
print(f"先頭: {repr(key[:20])}")  # BOMや隠れ文字を確認
if key != key.strip():
    print("WARNING: キーに前後の空白が含まれています（修正済み）")
if "\n" in key or "\r" in key:
    print("ERROR: キーに改行が含まれています！.env を編集して1行にしてください")
    sys.exit(1)
print()

# 2. REST API で直接テスト
import requests

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
payload = {"contents": [{"parts": [{"text": "Say OK"}]}], "generationConfig": {"maxOutputTokens": 50}}

print("REST API 呼び出し中...")
resp = requests.post(url, json=payload, timeout=30)

print(f"HTTP Status: {resp.status_code}")
print(f"レスポンス: {resp.text[:600]}\n")

if resp.status_code == 200:
    print("SUCCESS: キーは正常に動作しています！")
    sys.exit(0)

# エラー解析
try:
    err = resp.json().get("error", {})
    msg = err.get("message", "")
    details = err.get("details", [])

    print("--- エラー詳細 ---")
    print(f"メッセージ: {msg}")

    if "expired" in msg.lower() or "API_KEY_INVALID" in str(details):
        print("\n※「API key expired」は誤表示の可能性があります。")
        print("  実際の原因候補:")
        print("  1. キーに「アプリケーションの制限」がかかっている")
        print("     → https://console.cloud.google.com/apis/credentials")
        print("     → 該当キーを編集 > アプリケーションの制限を「なし」に")
        print("  2. Generative Language API が無効")
        print("     → Cloud Console > APIとサービス > ライブラリ")
        print("     → 「Generative Language API」を検索して有効化")
        print("  3. 地域制限で課金が必要")
        print("     → https://aistudio.google.com で課金を有効化")
except Exception as e:
    print(f"パースエラー: {e}")
