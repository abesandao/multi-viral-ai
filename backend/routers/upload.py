import os
import uuid

from fastapi import APIRouter, UploadFile, File, Query
from pydantic import BaseModel

import store

router = APIRouter(tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class YoutubeRequest(BaseModel):
    url: str
    transcript_language: str = "ja"  # ja | en
    output_language: str = "same"   # same | ja（英語動画を日本語で出力）


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    transcript_language: str = Query("ja", description="動画の言語: ja | en"),
    output_language: str = Query("same", description="出力: same | ja（英語動画を日本語で）"),
):
    job_id = str(uuid.uuid4())

    # ファイルをディスクに保存
    ext = os.path.splitext(file.filename or "file")[1]
    save_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    job = store.create_job(
        job_id,
        source_type="file",
        file_path=save_path,
        transcript_language=transcript_language,
        output_language=output_language,
    )

    return {"job_id": job["id"], "filename": file.filename, "status": job["status"]}


@router.post("/upload/youtube")
async def upload_youtube(req: YoutubeRequest):
    job_id = str(uuid.uuid4())

    job = store.create_job(
        job_id,
        source_type="youtube",
        source_url=req.url,
        transcript_language=req.transcript_language,
        output_language=req.output_language,
    )

    return {"job_id": job["id"], "url": req.url, "status": job["status"]}
