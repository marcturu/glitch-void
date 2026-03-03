"use client"

interface CursorProps {
  fast?: boolean
  visible?: boolean
}

export function Cursor({ fast = false, visible = true }: CursorProps) {
  if (!visible) return null

  return (
    <span
      className="inline-block w-2.5 h-5 bg-neon-green ml-0.5 align-middle"
      style={{
        animation: fast
          ? "cursor-blink-fast 0.3s infinite step-end"
          : "cursor-blink 1s infinite step-end",
        boxShadow: "0 0 8px var(--neon-green), 0 0 16px var(--neon-green)",
      }}
      aria-hidden="true"
    />
  )
}
