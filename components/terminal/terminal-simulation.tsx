"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Cursor } from "./cursor"
import { LogLine, type LogType } from "./log-line"
import { Scanlines } from "./scanlines"
import { BinaryRain } from "./binary-rain"

interface LogEntry {
  id: number
  type: LogType
  message: string
}

const LOG_MESSAGES: Record<LogType, string[]> = {
  INFO: [
    "system check complete",
    "kernel module loaded",
    "network interface up",
    "heartbeat ok",
    "cache synced",
    "config loaded from /etc/sys.conf",
    "daemon started on pid 3847",
    "telemetry stream active",
    "filesystem mounted: /dev/sda1",
    "connection pool initialized [32 threads]",
    "index rebuilt in 0.042s",
    "service registered: core.runtime",
    "snapshot saved to /var/state/0x3f",
    "upstream latency: 4ms",
  ],
  DEBUG: [
    "background process initialized",
    "thread pool: 4 active",
    "memory allocation: 64mb",
    "socket listener bound :8080",
    "GC cycle completed: 12ms",
    "trace id: 0xABCDEF42",
    "buffer flush in 200ms",
    "page fault resolved at 0x7fff",
    "heap compaction: freed 18mb",
    "inode lookup: 847 entries",
    "task queue depth: 142",
    "watchdog timer reset",
    "ring buffer rotated",
    "mutex acquired: resource_lock_07",
  ],
  WARN: [
    "entropy increasing",
    "memory fragmentation detected",
    "thermal threshold approaching",
    "disk I/O latency > 200ms",
    "packet loss: 2.4%",
    "swap usage at 78%",
    "certificate expires in 72h",
    "reconnection attempt #3",
    "deprecated call: sys.legacy.init()",
    "rate limit exceeded on /api/v2",
    "clock drift: +340ms",
    "orphaned process detected: pid 9921",
  ],
  ERROR: [
    "minor glitch detected",
    "segfault at address 0xDEADBEEF",
    "null reference in core.loop",
    "stack overflow in recursive_fn",
    "timeout: upstream not responding",
    "assertion failed: state != nil",
    "permission denied: /root/shadow",
    "checksum mismatch: block 447",
    "deadlock detected in thread_pool",
    "unhandled exception in worker_12",
    "bus error: misaligned access",
    "kernel panic: irrecoverable state",
  ],
}
  
const COMMANDS: Record<string, string[]> = {
  stop: ["__stop__"],
  help:   ["Available commands: help, ls, whoami, status, clear, exit, ping, ps, pwd, uname.", "Type 'stop' to halt the hacking."],
  ls:     ["bin/  dev/  etc/  proc/  sys/  usr/  var/  tmp/"],
  whoami: ["root"],
  status: ["system status: DEGRADED — 3 critical processes unresponsive"],
  clear:  ["__clear__"],
  exit:   ["permission denied: cannot exit"],
  ping:   ["PING localhost: Request timeout — host unreachable"],
  ps:     ["PID 1 init [zombie] | PID 847 kernel.loop [D] | PID 9921 orphan [?]"],
  pwd:    ["/root/sys/core"],
  uname:  ["Linux UNKNOWN 5.15.0 #1 SMP PREEMPT x86_64 GNU/Linux"],
}

function getRandomLog(phase: number): { type: LogType; message: string } {
  const typeWeights: Record<LogType, number> =
    phase < 15
      ? { INFO: 0.5, DEBUG: 0.35, WARN: 0.15, ERROR: 0.00 }
      : phase < 25
        ? { INFO: 0.2, DEBUG: 0.3, WARN: 0.3, ERROR: 0.2 }
        : { INFO: 0.00, DEBUG: 0.15, WARN: 0.35, ERROR: 0.5 }

  const rand = Math.random()
  let cumulative = 0
  let selectedType: LogType = "INFO"

  for (const [type, weight] of Object.entries(typeWeights)) {
    cumulative += weight
    if (rand <= cumulative) {
      selectedType = type as LogType
      break
    }
  }

  const messages = LOG_MESSAGES[selectedType]
  const message = messages[Math.floor(Math.random() * messages.length)]
  return { type: selectedType, message }
}

export function TerminalSimulation() {
  const [elapsed, setElapsed] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [halted, setHalted] = useState(false)
  const [finalFade, setFinalFade] = useState(false)
  const logIdRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [userInput, setUserInput] = useState("")
  const [userHistory, setUserHistory] = useState<{ command: string; response: string[] }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [stopped, setStopped] = useState(false)

  const stoppedRef = useRef(false)

  // Elapsed time tracker
  useEffect(() => {
    const startTime = Date.now()
    let rafId: number

    const tick = () => {
      const seconds = (Date.now() - startTime) / 1000
      setElapsed(Math.min(seconds, 40))
      if (seconds < 40 && !stoppedRef.current) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Log spawner
  useEffect(() => {
    const startTime = Date.now()
    let lastSpawn = Date.now()
    let nextInterval = 1200

    const getInterval = (elapsedNow: number) => {
      if (elapsedNow < 3)  return 1800 + Math.random() * 1000
      if (elapsedNow < 15) return 1000 + Math.random() * 800
      if (elapsedNow < 25) return 500  + Math.random() * 400
                           return 80 + Math.random() * 120
    }

    const loop = () => {
      const now = Date.now()
      const elapsedNow = (now - startTime) / 1000

      if (elapsedNow >= 3 && elapsedNow < 45 && !stoppedRef.current) {
        const timeSinceSpawn = now - lastSpawn

        if (timeSinceSpawn >= nextInterval) {
          lastSpawn = now
          nextInterval = getInterval(elapsedNow)
          const { type, message } = getRandomLog(elapsedNow)
          const id = logIdRef.current++
          setLogs((prev) => {
            const maxLogs = elapsedNow < 15 ? 25 : elapsedNow < 25 ? 50 : 80
            const updated = [...prev, { id, type, message }]
            return updated.length > maxLogs ? updated.slice(-maxLogs) : updated
          })
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    let rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current && elapsed >= 15) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, elapsed, userHistory])

  // Final collapse sequence
  useEffect(() => {
    if (elapsed >= 38 && !halted) {
      setFinalFade(true)
      const timer = setTimeout(() => {
        setLogs([])
        setHalted(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [elapsed, halted])

  const handleLogFadeOut = useCallback((id: number) => {
    setLogs((prev) => prev.filter((log) => log.id !== id))
  }, [])

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    const cmd = userInput.trim().toLowerCase()
    if (!cmd) return

    if (cmd === "clear") {
      setUserHistory([])
    } else {
      const response = COMMANDS[cmd] ?? [`command not found: ${cmd}`]
      if (response[0] === "__stop__") {
        stoppedRef.current = true
        setStopped(true)
      } else {
        setUserHistory((prev) => [...prev, { command: cmd, response: response }])
      }
    }
    setUserInput("")
  }

  const phase = elapsed < 3 ? 1 : elapsed < 15 ? 2 : elapsed < 25 ? 3 : elapsed < 35 ? 4 : 5
  const intensity = phase >= 3 ? 1 + (elapsed - 40) / 40 : 1
  const shouldVibrate = phase >= 3 && elapsed > 60
  const persistLogs = elapsed >= 60

  const glitchImageOpacity = phase >= 4
    ? Math.min((elapsed - 25) / 15, 0.3)
    : 0

  const bgStyle: React.CSSProperties =
    phase >= 3
      ? {
          background: `radial-gradient(ellipse at 50% 50%, 
            rgba(30, 15, 60, ${Math.min((elapsed - 40) / 80, 0.4)}) 0%, 
            rgba(10, 5, 30, ${Math.min((elapsed - 40) / 60, 0.3)}) 40%, 
            rgba(0, 0, 0, 1) 100%)`,
          transition: "background 2s ease",
        }
      : { background: "#0a0a0a" }

  const inputBlock = !halted && (
    <div
      className="mt-2 flex flex-col gap-1"
      onClick={() => inputRef.current?.focus()}
    >
      {userHistory.map((entry, i) => (
        <div key={i} className="text-sm">
          <div className="text-neon-green/60">
            <span className="opacity-40 select-none mr-1">{">"}</span>
            {entry.command}
          </div>
          <div className="text-neon-cyan/50 pl-4">
            {entry.response.map((line, j) => (
              <div key={j}>{line}</div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center text-neon-green/60 text-sm">
        <span className="opacity-40 select-none mr-1">{">"}</span>
        <span>{userInput}</span>
        <Cursor fast={phase === 4} />
      </div>
      <input
        ref={inputRef}
        autoFocus
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleCommand}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        aria-label="terminal input"
      />
    </div>
  )

  return (
    <main
      className="relative w-screen h-screen overflow-hidden font-mono"
      style={bgStyle}
    >
      <Scanlines />

      {/* Sistema detenido por el usuario */}
      {stopped && (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div
            className="text-neon-green/90 text-xs tracking-widest text-center"
            style={{
              animation: "log-fade-in 0.5s ease-out forwards",
              textShadow: "0 0 8px var(--neon-green)",
            }}
          >
            <div>shutdown sequence initiated by root</div>
            <div className="mt-1 opacity-60">all processes terminated</div>
            <div className="opacity-60">filesystem unmounted cleanly</div>
          </div>
          <div
            className="text-neon-green/80 text-lg tracking-widest mt-4"
            style={{
              animation: "log-fade-in 1s ease-out 0.8s both",
              textShadow: "0 0 10px var(--neon-green), 0 0 20px var(--neon-green), 0 0 40px var(--neon-green)",
            }}
          >
            System safe.
          </div>
        </div>
      )}

      {/* Efecto apagado TV */}
      {halted && (
        <div
          className="fixed inset-0 z-50 bg-white"
          style={{
            animation: "screen-off 1s ease-in 0.5s both",
            transformOrigin: "center center",
          }}
        />
      )}

      {phase >= 5 && !halted && (
        <div
          className="fixed inset-0 z-10 pointer-events-none"
          style={{ animation: "glitch-flicker 0.2s infinite" }}
        >
          <img
            src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920"
            alt=""
            className="w-full h-full object-cover"
            style={{
              opacity: glitchImageOpacity,
              mixBlendMode: "screen",
              filter: `hue-rotate(${Math.floor(elapsed * 15) % 360}deg) saturate(3) contrast(1.5)`,
            }}
          />
        </div>
      )}

      {/* Binary rain in phase >= 4 */}
      {phase >= 3 && !halted && (
        <BinaryRain opacity={glitchImageOpacity} />
      )}

      {/* Blur overlay */}
      {phase >= 3 && (
        <div
          className="pointer-events-none fixed inset-0 z-10"
          style={{
            backdropFilter: `blur(${Math.min((elapsed - 35) / 5, 0.8)}px)`,
            transition: "backdrop-filter 2s ease",
          }}
          aria-hidden="true"
        />
      )}

      {/* Terminal content */}
      <div
        ref={containerRef}
        className="relative z-20 flex flex-col p-6 md:p-10 h-full overflow-y-auto"
        style={{
          animation: finalFade ? "final-fade 2.5s ease-out forwards" : undefined,
        }}
      >
        {/* Phase 1: solo input */}
        {phase === 1 && !halted && (
          <div
            className="flex h-full items-center">
            {inputBlock}
            <img src="/GlitchVoid.png" alt="Glitch Void" className="absolute top-1/2 left-1/2 w-48 h-48 object-contain -translate-x-1/2 -translate-y-1/2 pointer-events-none fade-out"/>
          </div>
        )}

        {/* Phase 2-4: Logs + input */}
        {phase >= 2 && !halted && (
          <div className="flex flex-col gap-1">
            <div className="text-neon-green/40 text-xs mb-4 select-none">
              {"// system.process.monitor v2.7.1"}
            </div>

            {logs.map((log) => (
              <LogLine
                key={log.id}
                type={log.type}
                message={log.message}
                duration={elapsed < 15 ? 2000 : elapsed < 25 ? 3000 : 5000}
                intensity={intensity}
                vibrate={shouldVibrate}
                persist={persistLogs}
                onFadeOut={() => handleLogFadeOut(log.id)}
              />
            ))}

            {phase >= 3 && !halted && userHistory.length === 0 && (
              <div
                className="text-neon-green/20 text-xs tracking-widest select-none mt-2"
                style={{ animation: "log-fade-in 1s ease-out 1s both" }}
              >
                Maybe you need some <span className="text-neon-green/40">"help"</span>
              </div>
            )}

            {inputBlock}
          </div>
        )}

        {/* System halted */}
        {halted && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className="text-neon-green/90 text-xs tracking-widest text-center"
              style={{
                animation: "log-fade-in 0.5s ease-out forwards",
                textShadow: "0 0 8px var(--neon-green)",
              }}
            >
              <div>KERNEL PANIC - not syncing: Fatal exception</div>
              <div className="mt-1 opacity-60">CPU: 0 PID: 1 Comm: init</div>
              <div className="opacity-60">hardware name: UNKNOWN</div>
            </div>
            <div
              className="text-neon-green/80 text-lg tracking-widest mt-4"
              style={{
                animation: "log-fade-in 1s ease-out 0.8s both",
                textShadow: "0 0 10px var(--neon-green), 0 0 20px var(--neon-green), 0 0 40px var(--neon-green)",
              }}
            >
              System halted.
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-4 right-4 z-30 text-muted-foreground/30 text-xs font-mono select-none flex flex-col items-end gap-2">
        <a
          href="https://github.com/marcturu/glitch-void" 
          target="_blank" 
          rel="noopener noreferrer"
          className="transition-transform duration-300 ease-in-out hover:scale-105 hover:opacity-80"
        >
          <img 
            src="/GlitchVoid.png" 
            alt="Glitch Void" 
            className="h-10 w-auto" 
          />
        </a>
        {Math.floor(elapsed)}s / 40s   
        <p>© 2026 <a href="https://github.com/marcturu" target="_blank">Marc Turu Roca</a></p>
      </div>
    </main>
  )
}