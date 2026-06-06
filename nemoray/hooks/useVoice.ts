"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { probeVoice, synthesize, transcribe } from "@/lib/api/voice";
import { useNemoStore } from "@/store";

/** Pick a MediaRecorder mime type the current browser actually supports. */
function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export interface UseVoice {
  /** Whether ElevenLabs is wired (probed from the server). */
  available: boolean;
  recording: boolean;
  transcribing: boolean;
  speaking: boolean;
  /** Live input level 0..1 (RMS) while recording — drives the meter. */
  level: number;
  startRecording(): Promise<void>;
  stopRecording(): void;
  /** Speak arbitrary text (queued, sequential playback). */
  speak(text: string): Promise<void>;
}

export function useVoice(): UseVoice {
  const available = useNemoStore((s) => s.voiceAvailable);
  const recording = useNemoStore((s) => s.voiceRecording);
  const transcribing = useNemoStore((s) => s.voiceTranscribing);
  const speaking = useNemoStore((s) => s.voiceSpeaking);

  const setVoiceAvailable = useNemoStore((s) => s.setVoiceAvailable);
  const setVoiceRecording = useNemoStore((s) => s.setVoiceRecording);
  const setVoiceTranscribing = useNemoStore((s) => s.setVoiceTranscribing);
  const setVoiceSpeaking = useNemoStore((s) => s.setVoiceSpeaking);
  const addOperatorMessage = useNemoStore((s) => s.addOperatorMessage);
  const requestAgentRun = useNemoStore((s) => s.requestAgentRun);

  const [level, setLevel] = useState(0);

  // ── recording refs ──
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── playback refs ──
  const playEl = useRef<HTMLAudioElement | null>(null);
  const playQueue = useRef<string[]>([]);
  const playing = useRef(false);

  // Probe availability once on mount.
  useEffect(() => {
    let alive = true;
    void probeVoice().then((ok) => {
      if (alive) setVoiceAvailable(ok);
    });
    return () => {
      alive = false;
    };
  }, [setVoiceAvailable]);

  // ── level metering ──
  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  const runMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      // Light non-linear shaping so quiet speech still moves the meter.
      setLevel(Math.min(1, rms * 3.2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── teardown of the recording graph (stream, ctx, raf) ──
  const teardownRecording = useCallback(() => {
    stopMeter();
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    recorderRef.current = null;
  }, [stopMeter]);

  const startRecording = useCallback(async () => {
    if (!available) return;
    if (recorderRef.current) return; // already recording
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Level meter graph.
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;
        runMeter();
      }

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        teardownRecording();
        setVoiceRecording(false);

        if (blob.size === 0) return;

        setVoiceTranscribing(true);
        void transcribe(blob)
          .then((text) => {
            const trimmed = text.trim();
            if (trimmed.length > 0) {
              addOperatorMessage(trimmed);
              requestAgentRun({ prompt: trimmed });
            }
          })
          .catch(() => {})
          .finally(() => setVoiceTranscribing(false));
      };

      recorder.start();
      setVoiceRecording(true);
    } catch {
      teardownRecording();
      setVoiceRecording(false);
    }
  }, [
    available,
    runMeter,
    teardownRecording,
    setVoiceRecording,
    setVoiceTranscribing,
    addOperatorMessage,
    requestAgentRun,
  ]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "inactive") {
      recorder.stop(); // triggers onstop → transcription pipeline
    } else {
      teardownRecording();
      setVoiceRecording(false);
    }
  }, [teardownRecording, setVoiceRecording]);

  // ── TTS playback queue ──
  // A single in-flight drain loop processes the queue sequentially; `speak`
  // just enqueues and kicks it off when idle (no self-referential callback).
  const drainQueue = useCallback(async () => {
    if (playing.current) return;
    playing.current = true;
    setVoiceSpeaking(true);

    try {
      for (;;) {
        const next = playQueue.current.shift();
        if (next === undefined) break;

        let url: string | null = null;
        try {
          const blob = await synthesize(next);
          url = URL.createObjectURL(blob);
          const el = playEl.current ?? new Audio();
          playEl.current = el;
          el.src = url;
          await new Promise<void>((resolve) => {
            const done = () => {
              el.onended = null;
              el.onerror = null;
              resolve();
            };
            el.onended = done;
            el.onerror = done;
            void el.play().catch(done);
          });
        } catch {
          // swallow — keep the queue moving
        } finally {
          if (url) URL.revokeObjectURL(url);
        }
      }
    } finally {
      playing.current = false;
      setVoiceSpeaking(false);
    }
  }, [setVoiceSpeaking]);

  const speak = useCallback(
    async (text: string) => {
      if (!available) return;
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      playQueue.current.push(trimmed);
      await drainQueue();
    },
    [available, drainQueue],
  );

  // ── unmount cleanup ──
  useEffect(() => {
    return () => {
      teardownRecording();
      playQueue.current = [];
      const el = playEl.current;
      if (el) {
        el.pause();
        el.src = "";
      }
    };
  }, [teardownRecording]);

  return {
    available,
    recording,
    transcribing,
    speaking,
    level,
    startRecording,
    stopRecording,
    speak,
  };
}

/**
 * Optional companion: auto-speaks the latest COMPLETED agent message.
 * Mount this once (e.g. alongside the agent console) and toggle with `enabled`.
 * Safe no-op when voice is unavailable or disabled.
 */
export function useAutoSpeakLatest(speak: UseVoice["speak"], enabled: boolean): void {
  const available = useNemoStore((s) => s.voiceAvailable);
  const messages = useNemoStore((s) => s.messages);
  const streaming = useNemoStore((s) => s.streaming);
  const spokenId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !available) return;
    if (streaming) return;

    // Find the most recent finished agent message.
    let latest: (typeof messages)[number] | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "agent" && !m.streaming) {
        latest = m;
        break;
      }
    }
    if (!latest) return;

    // On first activation, mark the current latest as already spoken so we
    // don't replay history when the toggle is switched on.
    if (spokenId.current === null) {
      spokenId.current = latest.id;
      return;
    }
    if (latest.id === spokenId.current) return;

    spokenId.current = latest.id;
    if (latest.content.trim().length > 0) {
      void speak(latest.content);
    }
  }, [enabled, available, streaming, messages, speak]);
}
