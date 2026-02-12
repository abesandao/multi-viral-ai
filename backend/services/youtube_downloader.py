"""yt-dlp で YouTube から音声をダウンロードするサービス。"""

import os
import logging
import re

logger = logging.getLogger(__name__)

# YouTube URL のパターン（短縮 URL含む）
YOUTUBE_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?(?:youtube\.com/(?:watch\?v=|shorts/)|youtu\.be/)[\w-]+"
)


def is_youtube_url(url: str) -> bool:
    """URL が YouTube かどうか判定。"""
    return bool(url and YOUTUBE_PATTERN.search(url.strip()))


def download_youtube_audio(url: str, output_dir: str, job_id: str) -> str:
    """
    YouTube URL から音声をダウンロードする。

    Args:
        url: YouTube の URL
        output_dir: 保存先ディレクトリ
        job_id: ジョブ ID（ファイル名に使用）

    Returns:
        ダウンロードした音声ファイルのパス（.m4a または .webm）

    Raises:
        ValueError: URL が無効、またはダウンロード失敗時
    """
    import yt_dlp

    url = url.strip()
    if not is_youtube_url(url):
        raise ValueError(f"無効な YouTube URL: {url}")

    os.makedirs(output_dir, exist_ok=True)
    out_tmpl = os.path.join(output_dir, f"{job_id}_youtube.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": {"default": out_tmpl},
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "m4a",
                "preferredquality": "128",
            }
        ],
    }

    def _find_downloaded_file():
        for f in os.listdir(output_dir):
            if f.startswith(f"{job_id}_youtube."):
                return os.path.join(output_dir, f)
        return None

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info("Downloading YouTube audio: %s", url[:60])
            info = ydl.extract_info(url, download=True)
            if not info:
                raise ValueError("動画情報の取得に失敗しました")

            path = _find_downloaded_file()
            if path:
                logger.info("Downloaded: %s (%.1f MB)", path, os.path.getsize(path) / 1e6)
                return path

            raise ValueError("ダウンロードしたファイルが見つかりません")
    except yt_dlp.utils.DownloadError as e:
        # FFmpeg が無い場合は音声形式でそのまま取得
        if "FFmpeg" in str(e) or "ffmpeg" in str(e).lower():
            logger.info("FFmpeg not found, downloading raw audio...")
            opts = {
                "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
                "outtmpl": {"default": out_tmpl},
                "quiet": True,
                "no_warnings": True,
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            path = _find_downloaded_file()
            if path:
                return path
        logger.error("yt-dlp error: %s", e)
        raise ValueError(f"YouTube のダウンロードに失敗しました: {e}") from e
