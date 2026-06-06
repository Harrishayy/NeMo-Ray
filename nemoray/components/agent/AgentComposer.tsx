"use client";

import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react";
import { CornerDownLeft, Loader2, Mic, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/primitives";
import { useStreamingAgent } from "@/hooks/useStreamingAgent";
import { useAutoSpeakLatest, useVoice } from "@/hooks/useVoice";
import { useNemoStore } from "@/store";

/**
 * Bottom-pinned operator input for the agent console. Type a prompt and submit
 * on Enter, or hold the mic to dictate it — voice is just another way to talk to
 * the agent, transcribed straight into this same input pipeline (not a separate
 * card). Auto-speak echoes the agent's replies aloud when toggled on.
 */
export function AgentComposer({ className }: { className?: string }) {
  const [value, setValue] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const streaming = useNemoStore((s) => s.streaming);
  const { sendPrompt } = useStreamingAgent();
  const {
    available,
    recording,
    transcribing,
    speaking,
    startRecording,
    stopRecording,
    speak,
  } = useVoice();

  useAutoSpeakLatest(speak, autoSpeak);

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    sendPrompt(text);
    setValue("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Push-to-talk — hold the mic to record, release to transcribe + send.
  const onMicDown = useCallback(() => {
    if (!available || transcribing || streaming) return;
    void startRecording();
  }, [available, transcribing, streaming, startRecording]);

  const onMicUp = useCallback(() => {
    if (recording) stopRecording();
  }, [recording, stopRecording]);

  const canSend = value.trim().length > 0 && !streaming;

  const placeholder = streaming
    ? "Agent is responding…"
    : recording
      ? "Listening… release to send"
      : transcribing
        ? "Transcribing…"
        : "Ask the AI agent — type or hold the mic…";

  return (
    <div className={cn("shrink-0 border-t border-hairline bg-panel/60", className)}>
      <form onSubmit={onSubmit} className="flex items-center gap-2 px-2.5 py-2">
        {available && (
          <button
            type="button"
            aria-label="Hold to talk"
            aria-pressed={recording}
            disabled={transcribing || streaming}
            onPointerDown={onMicDown}
            onPointerUp={onMicUp}
            onPointerLeave={onMicUp}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center border transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nv",
              "disabled:cursor-not-allowed disabled:opacity-40",
              recording
                ? "border-critical bg-critical/10 text-critical"
                : "border-hairline text-ink-dim hover:border-nv hover:text-nv",
            )}
          >
            {transcribing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Mic size={14} className={cn(recording && "animate-pulse-soft")} />
            )}
          </button>
        )}

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={streaming || recording || transcribing}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            "min-w-0 flex-1 border border-hairline bg-bg px-2.5 py-1.5",
            "font-mono text-[12.5px] text-ink placeholder:text-ink-faint",
            "transition-colors focus:border-hairline-strong focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

        {available && (
          <button
            type="button"
            aria-label={autoSpeak ? "Mute agent replies" : "Speak agent replies"}
            aria-pressed={autoSpeak}
            onClick={() => setAutoSpeak((v) => !v)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center border transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nv",
              autoSpeak
                ? "border-info/60 text-info"
                : "border-hairline text-ink-faint hover:border-hairline-strong hover:text-ink-dim",
              speaking && autoSpeak && "animate-pulse-soft",
            )}
          >
            {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        )}

        <Button
          type="submit"
          variant="solid"
          size="md"
          disabled={!canSend}
          aria-label="Send to agent"
        >
          <CornerDownLeft size={13} />
          Send
        </Button>
      </form>

      <div className="flex items-center gap-1.5 px-2.5 pb-1.5">
        <span
          className={cn(
            "h-1 w-1 rounded-full",
            recording
              ? "animate-pulse-soft bg-critical"
              : streaming || transcribing || speaking
                ? "animate-pulse-soft bg-info"
                : "bg-ink-faint",
          )}
        />
        <span className="eyebrow text-[9px] text-ink-faint">
          {recording
            ? "Listening · release to send"
            : transcribing
              ? "Transcribing speech"
              : streaming
                ? "Streaming · input locked"
                : speaking
                  ? "Speaking reply"
                  : available
                    ? "Enter to send · hold mic to talk"
                    : "Enter to send"}
        </span>
      </div>
    </div>
  );
}
