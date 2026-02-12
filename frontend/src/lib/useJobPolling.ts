"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getJobStatus } from "./api";

export interface JobData {
  job_id: string;
  status: string;
  source_type: string;
  transcript: string | null;
  results: {
    viral_clips: {
      start_time: string;
      end_time: string;
      title: string;
      reason: string;
    }[];
    x_thread: string[];
    blog_article: string;
  } | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const TERMINAL = new Set(["completed", "error"]);

export function useJobPolling(jobId: string, intervalMs = 3000) {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollError, setPollError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      const data = await getJobStatus(jobId);
      setJob(data);
      setPollError(null);
      if (TERMINAL.has(data.status)) {
        // 完了したらポーリング停止
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch {
      setPollError("ステータスの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchOnce, intervalMs]);

  return { job, loading, pollError, refetch: fetchOnce };
}
