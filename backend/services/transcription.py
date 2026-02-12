"""OpenAI Whisper API で音声を文字起こしするサービス。"""

import os
import logging
import math

logger = logging.getLogger(__name__)

# Whisper API のファイルサイズ上限 (25MB)
MAX_FILE_SIZE = 25 * 1024 * 1024

# 1. OpenAI API 2. ローカル faster-whisper（無料） 3. ダミー
USE_OPENAI_API = bool(os.environ.get("OPENAI_API_KEY"))
USE_LOCAL_WHISPER = os.environ.get("USE_LOCAL_WHISPER", "1") == "1"


def transcribe_audio(file_path: str, language: str | None = None) -> dict:
    """
    音声ファイルを文字起こしする。

    Args:
        file_path: 音声ファイルパス
        language: 言語（ja|en）。None なら環境変数 TRANSCRIPT_LANGUAGE を使用

    Returns:
        {"text": str, "segments": [{"start": float, "end": float, "text": str}, ...]}
    """
    lang = language or os.environ.get("TRANSCRIPT_LANGUAGE", "ja")
    if USE_OPENAI_API:
        return _transcribe_whisper_api(file_path, lang)
    if USE_LOCAL_WHISPER and file_path and os.path.exists(file_path):
        try:
            return _transcribe_local_whisper(file_path, lang)
        except Exception as e:
            logger.warning("Local Whisper failed (%s), falling back to dummy: %s", file_path, e)
    return _transcribe_dummy(file_path)


def _transcribe_whisper_api(file_path: str, language: str = "ja") -> dict:
    """OpenAI Whisper API で文字起こし。25MB超のファイルはチャンク分割。"""
    from openai import OpenAI

    client = OpenAI()
    file_size = os.path.getsize(file_path)

    # 25MB 以下ならそのまま送信
    if file_size <= MAX_FILE_SIZE:
        logger.info("OpenAI Whisper API: transcription (%s, %.1f MB)",
                     file_path, file_size / 1e6)
        return _call_whisper_api(client, file_path)

    # 25MB 超なら pydub で分割して順番に処理
    logger.info("File too large (%.1f MB), splitting into chunks...", file_size / 1e6)
    return _transcribe_chunked(client, file_path)


def _call_whisper_api(client, file_path: str) -> dict:
    """Whisper API を1回呼び出す。"""
    lang_param = {} if language == "auto" else {"language": language}

    with open(file_path, "rb") as audio:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
            **lang_param,
        )

    segments = []
    for seg in (result.segments or []):
        segments.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text,
        })

    return {"text": result.text, "segments": segments}


def _transcribe_chunked(client, file_path: str) -> dict:
    """大きなファイルを10分ごとに分割して順番に文字起こし。"""
    from pydub import AudioSegment

    audio = AudioSegment.from_file(file_path)
    chunk_ms = 10 * 60 * 1000  # 10分
    num_chunks = math.ceil(len(audio) / chunk_ms)

    all_text = []
    all_segments = []
    offset_sec = 0.0

    for i in range(num_chunks):
        start_ms = i * chunk_ms
        end_ms = min((i + 1) * chunk_ms, len(audio))
        chunk = audio[start_ms:end_ms]

        # 一時ファイルに書き出し
        chunk_path = f"{file_path}_chunk{i}.wav"
        chunk.export(chunk_path, format="wav")

        logger.info("Transcribing chunk %d/%d (%.0fs - %.0fs)",
                     i + 1, num_chunks, start_ms / 1000, end_ms / 1000)

        try:
            result = _call_whisper_api(client, chunk_path)
            all_text.append(result["text"])

            for seg in result["segments"]:
                all_segments.append({
                    "start": seg["start"] + offset_sec,
                    "end": seg["end"] + offset_sec,
                    "text": seg["text"],
                })
        finally:
            os.remove(chunk_path)

        offset_sec += (end_ms - start_ms) / 1000

    return {"text": "".join(all_text), "segments": all_segments}


# ── ローカル Whisper（無料・要 faster-whisper） ──

def _transcribe_local_whisper(file_path: str, language: str = "ja") -> dict:
    """faster-whisper でローカル文字起こし。pip install faster-whisper"""
    from faster_whisper import WhisperModel

    model_size = os.environ.get("WHISPER_MODEL_SIZE", "small")  # base→small: 日本語精度向上
    device = "cuda" if os.environ.get("WHISPER_DEVICE") == "cuda" else "cpu"
    logger.info("Local Whisper: transcribing %s (model=%s, device=%s)", file_path, model_size, device)

    model = WhisperModel(model_size, device=device)
    # 言語: auto なら自動検出、ja/en なら指定
    model_lang = None if language == "auto" else language

    # initial_prompt: 専門用語の認識を助ける（日英共通）
    initial_prompt = os.environ.get(
        "WHISPER_INITIAL_PROMPT",
        "AI, content, creator, SNS, video, blog, tweet, YouTube",
    )
    segments_raw, info = model.transcribe(
        file_path,
        language=model_lang,
        beam_size=5,
        vad_filter=True,  # 無音区間をスキップして精度向上
        initial_prompt=initial_prompt,
    )

    segments = []
    all_text = []
    for seg in segments_raw:
        text = seg.text.strip()
        if text:
            segments.append({"start": seg.start, "end": seg.end, "text": text})
            all_text.append(text)

    return {"text": " ".join(all_text), "segments": segments}


# ── ダミー実装（開発用） ──

def _transcribe_dummy(file_path: str) -> dict:
    """ダミーの文字起こし結果を返す（APIキー未設定時）。"""
    logger.info("Dummy transcription for %s (OPENAI_API_KEY not set)", file_path)
    return {
        "text": (
            "こんにちは、今日はAIを使ったコンテンツ制作について話します。"
            "まず最初に、なぜAIがクリエイターにとって重要なのかを説明します。"
            "AIを使えば、1本の動画から複数のSNS投稿を自動で作れます。"
            "これにより、コンテンツの量産が可能になります。"
            "次に、具体的なワークフローを見ていきましょう。"
            "動画をアップロードするだけで、文字起こしが自動的に行われます。"
            "そしてAIが分析して、バズりそうなポイントを見つけ出します。"
            "最後に、実際のデモをお見せします。"
            "このツールを使えば、クリエイターの生産性は10倍になります。"
        ),
        "segments": [
            {"start": 0.0, "end": 15.0, "text": "こんにちは、今日はAIを使ったコンテンツ制作について話します。"},
            {"start": 15.0, "end": 35.0, "text": "まず最初に、なぜAIがクリエイターにとって重要なのかを説明します。"},
            {"start": 35.0, "end": 55.0, "text": "AIを使えば、1本の動画から複数のSNS投稿を自動で作れます。これにより、コンテンツの量産が可能になります。"},
            {"start": 55.0, "end": 75.0, "text": "次に、具体的なワークフローを見ていきましょう。"},
            {"start": 75.0, "end": 95.0, "text": "動画をアップロードするだけで、文字起こしが自動的に行われます。"},
            {"start": 95.0, "end": 115.0, "text": "そしてAIが分析して、バズりそうなポイントを見つけ出します。"},
            {"start": 115.0, "end": 135.0, "text": "最後に、実際のデモをお見せします。"},
            {"start": 135.0, "end": 150.0, "text": "このツールを使えば、クリエイターの生産性は10倍になります。"},
        ],
    }
