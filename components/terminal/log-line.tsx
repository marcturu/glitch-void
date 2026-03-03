"use client"

import { useEffect, useState } from "react"

export type LogType = "INFO" | "DEBUG" | "WARN" | "ERROR"

interface LogLineProps {
  type: LogType
  message: string
  duration?: number
  intensity?: number
  vibrate?: boolean
  persist?: boolean
  onFadeOut?: () => void
}

const LOG_COLORS: Record<LogType, { text: string; glow: string }> = {
  INFO: {
    text: "text-neon-green/80",
    glow: "drop-shadow-[0_0_4px_var(--neon-green)]",
  },
  DEBUG: {
    text: "text-neon-cyan/80",
    glow: "drop-shadow-[0_0_4px_var(--neon-cyan)]",
  },
  WARN: {
    text: "text-neon-amber/70",
    glow: "drop-shadow-[0_0_4px_var(--neon-amber)]",
  },
  ERROR: {
    text: "text-neon-red/70",
    glow: "drop-shadow-[0_0_4px_var(--neon-red)]",
  },
}

export function LogLine({
  type,
  message,
  duration = 1500,
  intensity = 1,
  vibrate = false,
  persist = false,
  onFadeOut,
}: LogLineProps) {
  const [phase, setPhase] = useState<"in" | "visible" | "out" | "gone">("in")

  useEffect(() => {
    const inTimer = setTimeout(() => setPhase("visible"), 300)
    let outTimer: NodeJS.Timeout
    let goneTimer: NodeJS.Timeout

    if (!persist) {
      outTimer = setTimeout(() => setPhase("out"), duration)
      goneTimer = setTimeout(() => {
        setPhase("gone")
        onFadeOut?.()
      }, duration + 500)
    }

    return () => {
      clearTimeout(inTimer)
      clearTimeout(outTimer)
      clearTimeout(goneTimer)
    }
  }, [duration, persist, onFadeOut])

  if (phase === "gone") return null

  const colors = LOG_COLORS[type]
  const glowIntensity = intensity > 1.5 ? "drop-shadow-[0_0_12px_currentColor]" : colors.glow

  return (
    <div
      className={`text-sm leading-relaxed ${colors.text} ${glowIntensity} transition-all`}
      style={{
        animation:
          phase === "in"
            ? "log-fade-in 0.3s ease-out forwards"
            : phase === "out"
              ? "log-fade-out 0.5s ease-in forwards"
              : vibrate
                ? "vibrate 0.1s infinite"
                : undefined,
        opacity: phase === "in" ? 0 : undefined,
      }}
    >
      <span className="opacity-40 mr-2 select-none">
        {new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(11, 23)}
      </span>
      <span className="font-bold">[{type}]</span>{" "}
      <span>{message}</span>
    </div>
  )
}
