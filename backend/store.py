"""
インメモリのジョブストア。
本番では Supabase に差し替える。
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any


_lock = threading.Lock()
_jobs: dict[str, dict[str, Any]] = {}


def create_job(
    job_id: str,
    *,
    source_type: str,
    source_url: str | None = None,
    file_path: str | None = None,
    transcript_language: str = "ja",
    output_language: str = "same",
) -> dict[str, Any]:
    job = {
        "id": job_id,
        "source_type": source_type,
        "source_url": source_url,
        "file_path": file_path,
        "transcript_language": transcript_language,
        "output_language": output_language,
        "status": "uploaded",
        "transcript": None,
        "results": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _jobs[job_id] = job
    return job


def get_job(job_id: str) -> dict[str, Any] | None:
    with _lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **fields: Any) -> dict[str, Any] | None:
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return None
        job.update(fields)
        job["updated_at"] = datetime.now(timezone.utc).isoformat()
        return job


def list_jobs() -> list[dict[str, Any]]:
    with _lock:
        return list(_jobs.values())
