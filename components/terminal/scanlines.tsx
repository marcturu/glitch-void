"use client"

export function Scanlines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
      style={{
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)",
        animation: "flicker 4s infinite",
      }}
    />
  )
}
