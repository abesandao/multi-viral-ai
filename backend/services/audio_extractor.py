"""動画ファイルから音声を抽出するサービス。"""

import os
import logging
import shutil

logger = logging.getLogger(__name__)

# 音声のみのファイルはそのままWhisperに渡せる拡張子
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".aac"}

# 動画ファイルから音声抽出が必要な拡張子
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".wmv"}


def extract_audio(input_path: str, output_dir: str) -> str:
    """
    動画ファイルから音声を抽出して WAV で保存する。
    音声ファイルの場合はそのまま返す。

    Returns:
        音声ファイルのパス
    """
    ext = os.path.splitext(input_path)[1].lower()

    # 既に音声ファイルならそのまま返す
    if ext in AUDIO_EXTENSIONS:
        logger.info("Input is already audio: %s", input_path)
        return input_path

    # 動画ファイルなら moviepy で音声を抽出
    if ext in VIDEO_EXTENSIONS:
        return _extract_with_moviepy(input_path, output_dir)

    # 不明な拡張子でもとりあえず moviepy で試す
    logger.warning("Unknown extension '%s', attempting extraction anyway", ext)
    return _extract_with_moviepy(input_path, output_dir)


def _extract_with_moviepy(video_path: str, output_dir: str) -> str:
    """moviepy を使って動画から音声を WAV で抽出。"""
    from moviepy import VideoFileClip

    base = os.path.splitext(os.path.basename(video_path))[0]
    audio_path = os.path.join(output_dir, f"{base}_audio.wav")

    logger.info("Extracting audio: %s -> %s", video_path, audio_path)

    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(
        audio_path,
        codec="pcm_s16le",  # WAV 16bit
        fps=16000,          # Whisper は 16kHz を想定
        logger=None,        # moviepy のプログレスバーを抑制
    )
    clip.close()

    logger.info("Audio extracted: %s (%.1f MB)", audio_path, os.path.getsize(audio_path) / 1e6)
    return audio_path
