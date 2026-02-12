"""コンテンツ生成パイプライン。BackgroundTasks で非同期実行する。"""

import os
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException

import store
from services.audio_extractor import extract_audio
from services.transcription import transcribe_audio
from services.ai_generator import generate_content
from services.youtube_downloader import download_youtube_audio, is_youtube_url

logger = logging.getLogger(__name__)

router = APIRouter(tags=["generate"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")


def _process_job(job_id: str):
    """
    バックグラウンドで実行される処理パイプライン。

    Step 1: 動画 → 音声抽出 (moviepy)
    Step 2: 音声 → 文字起こし (Whisper API)
    Step 3: 文字起こし → コンテンツ生成 (Claude API)
    Step 4: 結果を保存、ステータスを completed に更新
    """
    job = store.get_job(job_id)
    if job is None:
        logger.error("Job %s not found", job_id)
        return

    try:
        file_path = job.get("file_path") or ""
        source_url = job.get("source_url") or ""
        source_type = job.get("source_type") or ""
        logger.info("[%s] source_type=%s, source_url=%s, file_path=%s",
                    job_id, source_type, (source_url[:50] + "..." if len(source_url) > 50 else source_url) if source_url else "None", file_path or "None")

        # ── Step 0: YouTube の場合はダウンロード ──
        is_youtube = source_type == "youtube" or (source_url and is_youtube_url(source_url))
        need_download = not file_path or not os.path.exists(file_path)
        if is_youtube and need_download:
            if not source_url:
                logger.error("[%s] YouTube job but source_url is empty", job_id)
                store.update_job(job_id, status="error", error="YouTube URL が設定されていません")
                return
            store.update_job(job_id, status="downloading")
            logger.info("[%s] Step 0: Downloading from YouTube: %s", job_id, source_url[:60])
            try:
                file_path = download_youtube_audio(source_url, UPLOAD_DIR, job_id)
                store.update_job(job_id, file_path=file_path)
            except ValueError as e:
                logger.error("[%s] YouTube download failed: %s", job_id, e)
                store.update_job(job_id, status="error", error=str(e))
                return

        # ── Step 1: 音声抽出 ──
        store.update_job(job_id, status="transcribing")
        logger.info("[%s] Step 1: Extracting audio from %s", job_id, file_path)

        if file_path and os.path.exists(file_path):
            audio_path = extract_audio(file_path, UPLOAD_DIR)
        else:
            audio_path = None
            logger.warning("[%s] File not found, using dummy transcription", job_id)

        # ── Step 2: 文字起こし ──
        transcript_lang = job.get("transcript_language") or "ja"
        logger.info("[%s] Step 2: Transcribing audio (lang=%s)...", job_id, transcript_lang)
        transcript_data = transcribe_audio(audio_path or file_path or "", language=transcript_lang)
        transcript_text = transcript_data["text"]
        segments = transcript_data.get("segments", [])

        store.update_job(job_id, transcript=transcript_text)
        logger.info("[%s] Transcription done (%d chars, %d segments)",
                     job_id, len(transcript_text), len(segments))

        # 抽出した音声ファイルを削除（元の動画ファイルとは別の場合のみ）
        if audio_path != file_path and os.path.exists(audio_path):
            os.remove(audio_path)
            logger.info("[%s] Cleaned up extracted audio: %s", job_id, audio_path)

        # ── Step 3: コンテンツ生成 ──
        output_lang = job.get("output_language") or "same"
        store.update_job(job_id, status="generating")
        logger.info("[%s] Step 3: Generating content with AI (output=%s)...", job_id, output_lang)

        results = generate_content(transcript_text, segments, output_language=output_lang)

        # ── Step 4: 結果を保存 ──
        store.update_job(job_id, status="completed", results=results)
        logger.info("[%s] Pipeline completed!", job_id)

    except Exception as e:
        logger.exception("[%s] Pipeline failed: %s", job_id, e)
        store.update_job(job_id, status="error", error=str(e))


@router.post("/generate/{job_id}")
async def start_generation(job_id: str, background_tasks: BackgroundTasks):
    job = store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] not in ("uploaded", "error"):
        raise HTTPException(
            status_code=409,
            detail=f"Job is already {job['status']}",
        )

    store.update_job(job_id, status="processing")
    background_tasks.add_task(_process_job, job_id)

    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Content generation started",
    }


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "source_type": job["source_type"],
        "transcript": job["transcript"],
        "results": job["results"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


@router.get("/jobs")
async def list_jobs():
    jobs = store.list_jobs()
    return [
        {
            "job_id": j["id"],
            "status": j["status"],
            "source_type": j["source_type"],
            "created_at": j["created_at"],
        }
        for j in jobs
    ]
