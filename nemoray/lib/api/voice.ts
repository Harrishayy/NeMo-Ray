import { getJson } from "@/lib/api/client";

/** Whether ElevenLabs is wired (server holds the key). Probed at runtime. */
export async function probeVoice(): Promise<boolean> {
  try {
    const { available } = await getJson<{ available: boolean }>("/api/voice/status");
    return available;
  } catch {
    return false;
  }
}

/** Speech-to-text: send recorded audio, get a transcript. */
export async function transcribe(audio: Blob): Promise<string> {
  const res = await fetch("/api/voice/stt", {
    method: "POST",
    headers: { "Content-Type": audio.type || "audio/webm" },
    body: audio,
  });
  if (!res.ok) throw new Error(`/api/voice/stt → ${res.status}`);
  const { text } = (await res.json()) as { text: string };
  return text;
}

/** Text-to-speech: get spoken audio for an agent message. */
export async function synthesize(text: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error(`/api/voice/tts → ${res.status}`);
  return await res.blob();
}
