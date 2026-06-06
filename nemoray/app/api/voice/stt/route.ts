// POST /api/voice/stt — Speech-to-Text via ElevenLabs Scribe.
//
// Body: raw audio bytes (Content-Type carries the codec, e.g. audio/webm).
// Forwards to https://api.elevenlabs.io/v1/speech-to-text as multipart/form-data
// (`file` + `model_id: scribe_v1`, header `xi-api-key`).
// Returns { text } on success; 503 if no key; 502 on upstream failure.

const STT_ENDPOINT = "https://api.elevenlabs.io/v1/speech-to-text";

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "voice unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const audio = await req.arrayBuffer();
    if (audio.byteLength === 0) {
      return new Response(JSON.stringify({ error: "empty audio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "audio/webm";
    const ext = contentType.includes("wav")
      ? "wav"
      : contentType.includes("mp4") || contentType.includes("mpeg")
        ? "mp4"
        : contentType.includes("ogg")
          ? "ogg"
          : "webm";

    const form = new FormData();
    form.append("file", new Blob([audio], { type: contentType }), `audio.${ext}`);
    form.append("model_id", "scribe_v1");

    const upstream = await fetch(STT_ENDPOINT, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "speech-to-text failed", status: upstream.status, detail }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = (await upstream.json()) as { text?: string };
    return Response.json({ text: data.text ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "speech-to-text error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
