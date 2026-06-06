// POST /api/voice/tts — Text-to-Speech via ElevenLabs.
//
// Body: { text }. Calls https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
// (header `xi-api-key`, accept `audio/mpeg`, model `eleven_turbo_v2_5`) and
// streams the MP3 bytes back with Content-Type: audio/mpeg.
// 503 if no key; 502 on upstream failure.

const TTS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";
// Rachel — a known public ElevenLabs default voice.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "voice unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = (await req.json()) as { text?: unknown };
    if (typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "missing text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

    const upstream = await fetch(`${TTS_BASE}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5" }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "text-to-speech failed", status: upstream.status, detail }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "text-to-speech error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
