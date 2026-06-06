"use client";

import { useCallback, useState } from "react";
import { AudioLines, Mic, MicOff } from "lucide-react";

import { Panel, PanelHeader, StatusDot, Toggle, type Status } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { useAutoSpeakLatest, useVoice } from "@/hooks/useVoice";

const METER_BARS = 14;

/**
 * VOICE LINK instrument — push-to-talk STT in, ElevenLabs TTS out.
 * Designed to sit in the right rail under the agent console. Renders a clean
 * disabled state when no ELEVENLABS_API_KEY is configured (the common demo case).
 */
export function VoiceControl({ className }: { className?: string }) {
  const { available, recording, transcribing, speaking, level, startRecording, stopRecording, speak } =
    useVoice();

  const [autoSpeak, setAutoSpeak] = useState(false);
  useAutoSpeakLatest(speak, autoSpeak);

  const dotStatus: Status = speaking
    ? "info"
    : recording
      ? "critical"
      : available
        ? "nominal"
        : "idle";
  const dotPulse = speaking || recording;

  const phase = recording
    ? "LISTENING"
    : transcribing
      ? "TRANSCRIBING"
      : speaking
        ? "SPEAKING"
        : "IDLE";

  // Push-to-talk handlers — hold to record, release to stop & transcribe.
  const onPress = useCallback(() => {
    if (!available || transcribing) return;
    void startRecording();
  }, [available, transcribing, startRecording]);

  const onRelease = useCallback(() => {
    if (recording) stopRecording();
  }, [recording, stopRecording]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        onPress();
      }
    },
    [onPress],
  );

  const onKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onRelease();
      }
    },
    [onRelease],
  );

  return (
    <Panel className={className}>
      <PanelHeader
        label="VOICE LINK"
        sub="ELEVENLABS"
        right={<StatusDot status={dotStatus} pulse={dotPulse} />}
      />

      {!available ? (
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center opacity-70">
          <MicOff className="h-6 w-6 text-ink-faint" strokeWidth={1.5} />
          <span className="eyebrow text-ink-dim">VOICE UNAVAILABLE</span>
          <p className="readout text-[10px] leading-relaxed text-ink-faint">
            Set <span className="text-ink-dim">ELEVENLABS_API_KEY</span> to enable
            <br />
            speech in / synthesised replies out.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          {/* Push-to-talk key */}
          <button
            type="button"
            aria-label="Push to talk"
            aria-pressed={recording}
            disabled={transcribing}
            onPointerDown={onPress}
            onPointerUp={onRelease}
            onPointerLeave={onRelease}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            className={cn(
              "group relative flex h-20 select-none flex-col items-center justify-center gap-1.5",
              "border bg-bg/60 transition-all",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nv",
              "disabled:cursor-not-allowed disabled:opacity-40",
              recording
                ? "border-critical bg-critical/10 text-critical"
                : "border-hairline-strong text-ink hover:border-nv hover:text-nv",
            )}
          >
            {/* red pulse ring while live — unmistakable */}
            {recording && (
              <span className="pointer-events-none absolute inset-0 animate-pulse-soft border border-critical/60 shadow-[0_0_22px_-4px_var(--color-critical)]" />
            )}
            <Mic
              className={cn("h-6 w-6", recording && "animate-pulse-soft")}
              strokeWidth={1.5}
            />
            <span className="eyebrow">
              {recording ? "RELEASE TO SEND" : "HOLD TO TALK"}
            </span>
          </button>

          {/* Live level meter */}
          <LevelMeter level={recording ? level : 0} active={recording} />

          {/* Status readouts */}
          <div className="flex items-center justify-between border-t border-hairline pt-2">
            <div className="flex flex-col gap-0.5">
              <span className="eyebrow text-ink-faint">STATE</span>
              <span
                className={cn(
                  "readout text-[11px]",
                  phase === "LISTENING" && "text-critical",
                  phase === "TRANSCRIBING" && "animate-blink text-nv-bright",
                  phase === "SPEAKING" && "text-info",
                  phase === "IDLE" && "text-ink-dim",
                )}
              >
                {phase}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AudioLines
                className={cn("h-3.5 w-3.5", speaking ? "text-info" : "text-ink-faint")}
                strokeWidth={1.5}
              />
              <span className="readout text-[11px] text-ink-dim tabular-nums">
                {Math.round((recording ? level : 0) * 100)
                  .toString()
                  .padStart(2, "0")}
                %
              </span>
            </div>
          </div>

          {/* Auto-speak toggle */}
          <label className="flex cursor-pointer items-center justify-between border-t border-hairline pt-2">
            <span className="eyebrow text-ink-dim">AUTO-SPEAK REPLIES</span>
            <Toggle
              checked={autoSpeak}
              onCheckedChange={setAutoSpeak}
              aria-label="Auto-speak agent replies"
            />
          </label>
        </div>
      )}
    </Panel>
  );
}

/** Animated bar meter driven by the live RMS level (0..1). */
function LevelMeter({ level, active }: { level: number; active: boolean }) {
  return (
    <div className="flex h-6 items-end gap-[2px]" aria-hidden>
      {Array.from({ length: METER_BARS }).map((_, i) => {
        const threshold = (i + 1) / METER_BARS;
        const lit = active && level >= threshold * 0.92;
        // Bars ramp green → amber → red toward the top of the scale.
        const tone =
          i >= METER_BARS - 2
            ? "bg-critical shadow-[0_0_6px_var(--color-critical)]"
            : i >= METER_BARS - 5
              ? "bg-warning shadow-[0_0_6px_var(--color-warning)]"
              : "bg-nv shadow-[0_0_6px_var(--color-nv-glow)]";
        return (
          <span
            key={i}
            className={cn(
              "flex-1 transition-all duration-75",
              lit ? tone : "bg-hairline-strong/40",
            )}
            style={{ height: `${30 + (i / METER_BARS) * 70}%` }}
          />
        );
      })}
    </div>
  );
}
