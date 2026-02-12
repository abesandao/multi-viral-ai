"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Film,
  Link,
  FileAudio,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { uploadFile, submitYoutubeUrl, generateContent, type VideoLang, type OutputLang } from "@/lib/api";

type UploadState = "idle" | "dragging" | "uploading" | "done" | "launching";

interface UploadAreaProps {
  onJobStarted: (jobId: string) => void;
}

export default function UploadArea({ onJobStarted }: UploadAreaProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [mode, setMode] = useState<"file" | "url">("file");
  const [videoLang, setVideoLang] = useState<VideoLang>("ja");
  const [outputLang, setOutputLang] = useState<OutputLang>("same");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
  }, []);

  const doUpload = async (selectedFile: File) => {
    setState("uploading");
    setProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 3));
    }, 80);

    try {
      const data = await uploadFile(selectedFile, videoLang, outputLang);
      clearInterval(interval);
      setProgress(100);
      setState("done");
      const id = data.job_id as string;
      setJobId(id);
      return id;
    } catch (err) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "アップロードに失敗しました。";
      const isNetwork = msg.includes("fetch") || msg.includes("Failed") || msg.includes("Network");
      setError(
        isNetwork || msg === "Upload failed"
          ? "接続できません。バックエンドが http://localhost:8001 で起動しているか確認してください。"
          : msg
      );
      setState("idle");
      return null;
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setMode("file");
      await doUpload(dropped);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        setFile(selected);
        setMode("file");
        await doUpload(selected);
      }
    },
    []
  );

  const handleUrlSubmit = async () => {
    if (!youtubeUrl.trim()) return;
    setState("uploading");
    setProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 3));
    }, 80);

    try {
      const data = await submitYoutubeUrl(youtubeUrl, videoLang, outputLang);
      clearInterval(interval);
      setProgress(100);
      setState("done");
      setJobId(data.job_id);
    } catch {
      clearInterval(interval);
      setError("YouTube URLの取得に失敗しました。");
      setState("idle");
    }
  };

  const launchGeneration = async (id: string) => {
    setState("launching");
    try {
      await generateContent(id);
      onJobStarted(id);
    } catch {
      setError("AI分析の開始に失敗しました。");
      setState("done");
    }
  };

  const reset = () => {
    setState("idle");
    setFile(null);
    setYoutubeUrl("");
    setProgress(0);
    setError(null);
    setJobId(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* 言語選択 */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">動画の言語:</span>
            <select
              value={videoLang}
              onChange={(e) => {
                const v = e.target.value as VideoLang;
                setVideoLang(v);
                if (v === "ja") setOutputLang("same");
              }}
              disabled={state !== "idle"}
              className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-neon-blue/50 disabled:opacity-50"
            >
              <option value="ja">日本語</option>
              <option value="en">英語</option>
            </select>
          </div>
          {videoLang === "en" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">出力:</span>
              <select
                value={outputLang}
                onChange={(e) => setOutputLang(e.target.value as OutputLang)}
                disabled={state !== "idle"}
                className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-neon-blue/50 disabled:opacity-50"
              >
                <option value="same">英語のまま</option>
                <option value="ja">日本語で要約</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 rounded-xl glass mb-6 max-w-xs mx-auto">
        <button
          onClick={() => { setMode("file"); reset(); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            mode === "file"
              ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Film className="w-4 h-4" />
          ファイル
        </button>
        <button
          onClick={() => { setMode("url"); reset(); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            mode === "url"
              ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Link className="w-4 h-4" />
          YouTube URL
        </button>
      </div>

      {/* File Upload */}
      {mode === "file" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => state === "idle" && inputRef.current?.click()}
          className={`
            relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
            transition-all duration-300 ease-out
            ${
              state === "dragging"
                ? "border-neon-blue bg-neon-blue/[0.08] scale-[1.02] glow-brand"
                : state === "uploading" || state === "done" || state === "launching"
                  ? "border-white/[0.08] bg-white/[0.03]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-neon-blue/40 hover:bg-neon-blue/[0.03]"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {state === "idle" || state === "dragging" ? (
            <div className="space-y-4">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300 ${
                state === "dragging"
                  ? "bg-neon-blue/20 scale-110 shadow-lg shadow-neon-blue/20"
                  : "bg-white/[0.05]"
              }`}>
                <Upload className={`w-7 h-7 transition-colors duration-300 ${
                  state === "dragging" ? "text-neon-blue" : "text-gray-500"
                }`} />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-200">
                  {state === "dragging" ? "ここにドロップ" : "動画・音声ファイルをドラッグ＆ドロップ"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  または<span className="text-neon-blue hover:underline cursor-pointer">クリックしてファイルを選択</span>
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5" />MP4, MOV, WebM</span>
                <span className="flex items-center gap-1"><FileAudio className="w-3.5 h-3.5" />MP3, WAV, M4A</span>
              </div>
            </div>
          ) : state === "uploading" ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 text-neon-blue mx-auto animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-300">アップロード中...</p>
                {file && <p className="text-xs text-gray-500 mt-1">{file.name} ({formatFileSize(file.size)})</p>}
              </div>
              <div className="max-w-xs mx-auto">
                <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-300 shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{progress}%</p>
              </div>
            </div>
          ) : state === "launching" ? (
            <div className="space-y-4">
              <div className="relative mx-auto w-fit">
                <Loader2 className="w-10 h-10 text-neon-purple mx-auto animate-spin" />
                <div className="absolute inset-0 w-10 h-10 mx-auto rounded-full bg-neon-purple/20 blur-md" />
              </div>
              <p className="text-sm font-medium text-neon-purple">AI分析を起動中...</p>
            </div>
          ) : (
            /* done state */
            <div className="space-y-5">
              <div className="relative mx-auto w-fit">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <div className="absolute inset-0 w-10 h-10 rounded-full bg-emerald-400/20 blur-md -z-10" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">アップロード完了</p>
                {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="px-4 py-2.5 text-sm rounded-lg text-gray-400 hover:text-white glass hover:bg-white/[0.08] transition-all duration-300"
                >
                  やり直す
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (jobId) launchGeneration(jobId); }}
                  className="group relative px-7 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-neon-blue to-cyan-400 text-white glow-button transition-all duration-300 hover:scale-[1.03]"
                  style={{ boxShadow: "0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)" }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AIで分析する
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue to-cyan-400 opacity-40 blur-xl -z-10 group-hover:opacity-60 transition-opacity duration-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* YouTube URL */
        <div className="rounded-2xl glass p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">YouTube URL を入力</label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/30 focus:shadow-[0_0_15px_rgba(0,212,255,0.1)] transition-all duration-300"
                  disabled={state !== "idle"}
                />
              </div>
              {state === "idle" && (
                <button
                  onClick={handleUrlSubmit}
                  disabled={!youtubeUrl.trim()}
                  className="px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-lg hover:shadow-neon-blue/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  取得
                </button>
              )}
            </div>
          </div>

          {state === "done" && mode === "url" ? (
            <div className="space-y-5 rounded-xl p-6 bg-white/[0.02] border border-neon-blue/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">取得完了</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{youtubeUrl}</p>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { reset(); }}
                  className="px-4 py-2.5 text-sm rounded-lg text-gray-400 hover:text-white glass hover:bg-white/[0.08] transition-all duration-300"
                >
                  やり直す
                </button>
                <button
                  onClick={() => jobId && launchGeneration(jobId)}
                  className="group relative px-7 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-neon-blue to-cyan-400 text-white glow-button hover:scale-[1.03] transition-all duration-300"
                  style={{ boxShadow: "0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)" }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AIで分析する
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue to-cyan-400 opacity-40 blur-xl -z-10 group-hover:opacity-60 transition-opacity duration-300" />
                </button>
              </div>
            </div>
          ) : (state === "uploading" || state === "launching") && mode === "url" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-neon-blue animate-spin" />
                <span className="text-sm text-gray-300">
                  {state === "launching" ? "AI分析を起動中..." : "動画を取得中..."}
                </span>
              </div>
              {state === "uploading" && (
                <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-300 shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
