"""Claude API でコンテンツを生成するサービス。"""

import os
import json
import re
import logging
import time

logger = logging.getLogger(__name__)

USE_CLAUDE = bool(os.environ.get("ANTHROPIC_API_KEY"))
_gemini_key = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
USE_GEMINI = bool(_gemini_key)

SYSTEM_PROMPT = """\
あなたはSNSコンテンツ戦略の専門家です。
動画の文字起こしテキストとタイムスタンプ情報を受け取り、以下の3つを生成してください。

1. viral_clips: 動画内の「バズりそうな切り抜き箇所」（3〜5個）
   - 文字起こしのタイムスタンプを参考に start_time / end_time を MM:SS 形式で指定
   - 各クリップにキャッチーなタイトルと、なぜバズるかの理由を記載

2. x_thread: X（旧Twitter）用のスレッド投稿（5〜10連投）
   - 1投目は強いフックで始める
   - 最終投稿にCTA（行動喚起）を入れる
   - 各投稿は280文字以内

3. blog_article: SEO最適化されたブログ記事（約800文字、Markdown形式）
   - h1, h2 の見出しを持つ
   - 簡潔にまとめる

重要: 出力言語は後述の指示に従ってください。

必ず有効なJSON形式のみで返答してください。改行・余分な空白は避け、コンパクトに。
マークダウンのコードブロック（```）で囲まないでください。"""

GENERATION_PROMPT = """\
以下の動画文字起こしを分析し、JSONで返してください。

## 出力フォーマット
{{
  "viral_clips": [
    {{
      "start_time": "MM:SS",
      "end_time": "MM:SS",
      "title": "切り抜きタイトル",
      "reason": "バズる理由の説明"
    }}
  ],
  "x_thread": [
    "1/N ツイート本文...",
    "2/N ツイート本文..."
  ],
  "blog_article": "# タイトル\\n\\nMarkdown形式の記事本文（約800文字）"
}}

## タイムスタンプ付き文字起こし
{transcript_with_timestamps}

## 全文テキスト
{transcript}
"""

# Structured output 用 JSON スキーマ（Gemini が有効な JSON のみ返すようにする）
GEMINI_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "viral_clips": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "start_time": {"type": "string", "description": "MM:SS形式"},
                    "end_time": {"type": "string", "description": "MM:SS形式"},
                    "title": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["start_time", "end_time", "title", "reason"],
            },
        },
        "x_thread": {
            "type": "array",
            "items": {"type": "string"},
            "description": "X用スレッド投稿",
        },
        "blog_article": {
            "type": "string",
            "description": "Markdown形式のブログ記事",
        },
    },
    "required": ["viral_clips", "x_thread", "blog_article"],
}


def _output_lang_instruction(output_language: str) -> str:
    """出力言語の指示文を返す。"""
    if output_language == "ja":
        return "必ず日本語で出力してください。文字起こしが英語の場合は、要約・翻訳して日本語で出力してください。"
    return "文字起こしが英語の場合は英語で、日本語の場合は日本語で出力してください。"


def generate_content(
    transcript: str,
    segments: list[dict] | None = None,
    output_language: str = "same",
) -> dict:
    """
    文字起こしテキストからコンテンツを生成する。

    Args:
        transcript: 文字起こし全文
        segments: [{"start": float, "end": float, "text": str}, ...]
        output_language: same=動画と同じ | ja=日本語で出力（英語動画を日本語化）

    Returns:
        {"viral_clips": [...], "x_thread": [...], "blog_article": "..."}
    """
    if USE_CLAUDE:
        return _generate_claude(transcript, segments, output_language)
    if USE_GEMINI:
        try:
            return _generate_gemini(transcript, segments, output_language)
        except Exception as e:
            logger.warning("Gemini API failed (%s): %s", type(e).__name__, e)
            logger.info("Trying Gemini REST API fallback...")
            try:
                return _generate_gemini_rest(transcript, segments, output_language)
            except Exception as e_rest:
                logger.warning("Gemini REST also failed (%s), trying Ollama...", type(e_rest).__name__)
            try:
                return _generate_ollama(transcript, segments, output_language)
            except Exception as e2:
                logger.warning("Ollama failed (%s), falling back to dummy: %s", type(e2).__name__, e2)
                return _generate_dummy(transcript)
    # Gemini 未設定時: Ollama を試してからダミー
    try:
        return _generate_ollama(transcript, segments, output_language)
    except Exception as e:
        logger.info("Ollama not available (%s), using dummy", type(e).__name__)
        return _generate_dummy(transcript)


def _format_timestamp(seconds: float) -> str:
    """秒数を MM:SS 形式に変換。"""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"


def _build_timestamped_transcript(segments: list[dict] | None) -> str:
    """セグメント情報をタイムスタンプ付きテキストに整形。"""
    if not segments:
        return "(タイムスタンプ情報なし)"

    lines = []
    for seg in segments:
        start = _format_timestamp(seg["start"])
        end = _format_timestamp(seg["end"])
        lines.append(f"[{start} - {end}] {seg['text']}")
    return "\n".join(lines)


def _generate_claude(transcript: str, segments: list[dict] | None = None, output_language: str = "same") -> dict:
    """Claude API でコンテンツを生成。"""
    import anthropic

    client = anthropic.Anthropic()
    logger.info("Claude API: generating content (%d chars transcript)", len(transcript))

    timestamped = _build_timestamped_transcript(segments)
    user_content = GENERATION_PROMPT.format(
        transcript=transcript,
        transcript_with_timestamps=timestamped,
    )
    user_content += f"\n\n## 出力言語\n{_output_lang_instruction(output_language)}"

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw = message.content[0].text
    logger.info("Claude API response received (%d chars)", len(raw))

    # JSON パース（```json ... ``` で囲まれている場合に対応）
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse Claude response as JSON: %s", e)
        logger.error("Raw response: %s", raw[:500])
        raise ValueError(f"Claude の応答をJSONとしてパースできませんでした: {e}") from e


def _parse_json_response(raw: str, source: str = "") -> dict:
    """生テキストから JSON を抽出してパース。途切れ・コードブロックに対応。"""
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 途切れた JSON の復元試行: 最初の { から有効な } までを探索
    start = cleaned.find("{")
    if start >= 0:
        for end in range(len(cleaned) - 1, start, -1):
            if cleaned[end] == "}":
                try:
                    obj = json.loads(cleaned[start : end + 1])
                    if "viral_clips" in obj and "x_thread" in obj and "blog_article" in obj:
                        return obj
                except json.JSONDecodeError:
                    continue

    raise ValueError(f"{source} の応答をJSONとしてパースできませんでした")


# ── Google Gemini（無料枠あり） ──

def _generate_gemini(transcript: str, segments: list[dict] | None = None, output_language: str = "same") -> dict:
    """Google Gemini API でコンテンツを生成。無料枠あり。"""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_gemini_key)
    logger.info("Gemini API: generating content (%d chars transcript)", len(transcript))

    timestamped = _build_timestamped_transcript(segments)
    user_prompt = GENERATION_PROMPT.format(
        transcript=transcript,
        transcript_with_timestamps=timestamped,
    )
    user_prompt += f"\n\n## 出力言語\n{_output_lang_instruction(output_language)}"
    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=8192,
            response_mime_type="application/json",
            response_schema=GEMINI_JSON_SCHEMA,
            thinking_config=types.ThinkingConfig(thinking_budget=0),  # トークン節約・JSON途切れ防止
        ),
    )
    raw = response.text or ""

    return _parse_json_response(raw, "Gemini")


# ── Gemini REST API（SDK が 400 を返す場合の代替） ──

def _generate_gemini_rest(transcript: str, segments: list[dict] | None = None, output_language: str = "same") -> dict:
    """Gemini REST API を直接呼ぶ（google-genai SDK の 400 回避用）。"""
    import requests

    timestamped = _build_timestamped_transcript(segments)
    user_prompt = GENERATION_PROMPT.format(
        transcript=transcript,
        transcript_with_timestamps=timestamped,
    )
    user_prompt += f"\n\n## 出力言語\n{_output_lang_instruction(output_language)}"
    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_gemini_key}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "responseMimeType": "application/json",
            "responseSchema": GEMINI_JSON_SCHEMA,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    resp = requests.post(url, json=payload, timeout=60)
    if resp.status_code != 200:
        err_msg = resp.text
        try:
            err_json = resp.json()
            err_msg = err_json.get("error", {}).get("message", err_msg)
        except Exception:
            pass
        raise ValueError(f"Gemini REST API error {resp.status_code}: {err_msg}")

    data = resp.json()
    raw = ""
    for c in data.get("candidates", []) or []:
        for p in c.get("content", {}).get("parts", []) or []:
            raw += p.get("text", "")

    return _parse_json_response(raw, "Gemini REST")


# ── Ollama（完全無料・ローカル・APIキー不要） ──

def _generate_ollama(transcript: str, segments: list[dict] | None = None, output_language: str = "same") -> dict:
    """Ollama でコンテンツを生成。Gemini が使えない場合の代替。"""
    import requests

    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_MODEL", "llama3.2")
    timestamped = _build_timestamped_transcript(segments)
    user_prompt = GENERATION_PROMPT.format(
        transcript=transcript,
        transcript_with_timestamps=timestamped,
    )
    user_prompt += f"\n\n## 出力言語\n{_output_lang_instruction(output_language)}"
    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

    logger.info("Ollama: generating content (%s, %d chars)", model, len(transcript))
    resp = requests.post(
        f"{base_url}/api/generate",
        json={"model": model, "prompt": full_prompt, "stream": False},
        timeout=120,
    )
    resp.raise_for_status()
    raw = resp.json().get("response", "") or ""

    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse Ollama response as JSON: %s", e)
        raise ValueError(f"Ollama の応答をJSONとしてパースできませんでした: {e}") from e


# ── ダミー実装（開発用） ──

def _generate_dummy(transcript: str) -> dict:
    """ダミーの生成結果を返す（ANTHROPIC_API_KEY 未設定時）。"""
    logger.info("Dummy generation (%d chars, ANTHROPIC_API_KEY not set)", len(transcript))
    time.sleep(3)

    return {
        "viral_clips": [
            {
                "start_time": "00:35",
                "end_time": "00:55",
                "title": "AIで1本の動画からSNS投稿を量産する方法",
                "reason": "具体的なメリットが簡潔に語られており、視聴者の興味を引きやすい。共感と驚きを同時に与えるフック。",
            },
            {
                "start_time": "01:35",
                "end_time": "01:55",
                "title": "クリエイターの生産性が10倍になる瞬間",
                "reason": "具体的な数字（10倍）を含み、インパクトが大きい。動画の結論部分でCTAとしても機能する。",
            },
            {
                "start_time": "01:55",
                "end_time": "02:30",
                "title": "実際のデモ：動画アップロードからコンテンツ生成まで",
                "reason": "実演パートはエンゲージメントが高い。How-to形式は保存・シェアされやすい。",
            },
        ],
        "x_thread": [
            "1/7 動画1本からSNSコンテンツを自動量産する方法を見つけました。クリエイターの生産性が文字通り10倍になります。スレッドで解説",
            "2/7 従来のワークフロー：\n・動画を撮影\n・手動で文字起こし\n・ブログ記事を書く\n・SNS投稿を考える\n\nこれ、全部で5-6時間かかりますよね？",
            "3/7 AIを使った新しいワークフロー：\n・動画をアップロード（1分）\n・AIが自動で文字起こし（2分）\n・コンテンツ自動生成（3分）\n\n合計：約6分。",
            "4/7 しかも生成されるのは3種類：\n・バズりそう切り抜きポイント（タイムスタンプ付き）\n・X用スレッド投稿\n・SEO最適化されたブログ記事",
            "5/7 特にすごいのが「バズ切り抜き検出」。AIが動画内の盛り上がりポイントを分析して、「なぜバズるか」の理由まで教えてくれる。",
            "6/7 ブログ記事もMarkdown形式で出力されるので、そのままWordPressやNotionに貼り付けるだけ。SEOのメタ情報も自動生成。",
            "7/7 コンテンツクリエイターにとって「量」と「質」の両立は永遠の課題。AIを味方につけて、1本の動画の価値を最大化しましょう。",
        ],
        "blog_article": (
            "# AIで動画1本からSNSコンテンツを量産する方法\n\n"
            "## はじめに\n\n"
            "コンテンツクリエイターにとって、最大の課題は「量と質の両立」です。"
            "1本の動画を撮影・編集するだけでも大変なのに、そこからブログ記事を書き、"
            "SNS投稿を考え、切り抜き動画を作る...。この作業だけで何時間もかかります。\n\n"
            "しかし、AIの進化により、この状況は大きく変わりつつあります。\n\n"
            "## AIによるコンテンツ自動展開とは\n\n"
            "AIによるコンテンツ自動展開とは、1本の動画や音声をアップロードするだけで、"
            "複数のプラットフォーム向けコンテンツを自動生成する仕組みです。\n\n"
            "具体的には、以下の3つのコンテンツが数分で生成されます：\n\n"
            "1. **バズる切り抜きポイント** - 動画内の盛り上がり箇所をAIが検出\n"
            "2. **X（Twitter）用スレッド** - 最大10連投のスレッド形式投稿\n"
            "3. **SEO最適化ブログ記事** - 約1,500文字のMarkdown記事\n\n"
            "## 従来のワークフローとの比較\n\n"
            "従来の方法では、動画の文字起こしだけでも30分〜1時間かかります。"
            "さらにそこからブログ記事を書くのに1〜2時間、SNS投稿を考えるのに30分。"
            "合計で3〜4時間は必要でした。\n\n"
            "AIを活用すると、これがわずか5〜10分に短縮されます。\n\n"
            "## 活用のポイント\n\n"
            "AIが生成したコンテンツをそのまま使うのではなく、自分の言葉でブラッシュアップすることが重要です。"
            "AIはあくまで「たたき台」を作るツール。最終的な品質は人間の手で仕上げましょう。\n\n"
            "## まとめ\n\n"
            "1本の動画から複数のSNSコンテンツを自動生成することで、クリエイターの生産性は飛躍的に向上します。"
            "AIを味方につけて、コンテンツの量産体制を構築しましょう。"
        ),
    }
