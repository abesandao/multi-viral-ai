const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001").replace(/\/$/, "");

export type VideoLang = "ja" | "en";
export type OutputLang = "same" | "ja";

export async function uploadFile(
  file: File,
  transcriptLanguage: VideoLang = "ja",
  outputLanguage: OutputLang = "same"
) {
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({
    transcript_language: transcriptLanguage,
    output_language: outputLanguage,
  });
  const res = await fetch(`${API_BASE}/api/upload?${params}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = "Upload failed";
    try {
      const json = JSON.parse(text);
      msg = json.detail || msg;
    } catch {
      if (text) msg = text.slice(0, 200);
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function submitYoutubeUrl(
  url: string,
  transcriptLanguage: VideoLang = "ja",
  outputLanguage: OutputLang = "same"
) {
  const res = await fetch(`${API_BASE}/api/upload/youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      transcript_language: transcriptLanguage,
      output_language: outputLanguage,
    }),
  });

  if (!res.ok) throw new Error("YouTube fetch failed");
  return res.json();
}

export async function generateContent(jobId: string) {
  const res = await fetch(`${API_BASE}/api/generate/${jobId}`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Generation failed");
  return res.json();
}

export async function getJobStatus(jobId: string) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);

  if (!res.ok) {
    const text = await res.text();
    let msg = "Failed to fetch status";
    try {
      const json = JSON.parse(text);
      msg = json.detail || msg;
    } catch {
      if (text) msg = text.slice(0, 100);
    }
    throw new Error(`[${res.status}] ${msg}`);
  }
  return res.json();
}
