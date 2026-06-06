// GET /api/voice/status — reports whether ElevenLabs is wired (key present, server-side).
export async function GET(): Promise<Response> {
  return Response.json({ available: Boolean(process.env.ELEVENLABS_API_KEY) });
}
