"use client"

import { useEffect, useRef } from "react"

export function BinaryRain({ opacity }: { opacity: number }) {
      const canvasRef = useRef<HTMLCanvasElement>(null)

      useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const fontSize = 14
        const columns = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(columns).fill(1)

        const draw = () => {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "#00ff41"
        ctx.font = `${fontSize}px monospace`

        for (let i = 0; i < drops.length; i++) {
            const text = Math.random() > 0.5 ? "1" : "0"
            ctx.fillText(text, i * fontSize, drops[i] * fontSize)

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0
            }
            drops[i]++
        }
        }

        const interval = setInterval(draw, 50)
        return () => clearInterval(interval)
    }, [])

    return (
        <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ opacity, mixBlendMode: "screen" }}
        />
    )

}