import { useEffect, useRef, useState, useCallback } from 'react'

type Phase = 'idle' | 'work' | 'break' | 'long-break'

interface UseFocusTimerOptions {
  workMinutes?: number
  breakMinutes?: number
  longBreakMinutes?: number
  cyclesBeforeLongBreak?: number
  onCycleComplete?: (cycle: number) => void
  onSessionEnd?: (totalSeconds: number) => void
}

export function useFocusTimer({
  workMinutes = 25,
  breakMinutes = 5,
  longBreakMinutes = 15,
  cyclesBeforeLongBreak = 4,
  onCycleComplete,
  onSessionEnd,
}: UseFocusTimerOptions = {}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60)
  const [cycle, setCycle] = useState(0)
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds =
    phase === 'work'
      ? workMinutes * 60
      : phase === 'long-break'
        ? longBreakMinutes * 60
        : breakMinutes * 60

  const progress = 1 - secondsLeft / totalSeconds

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const start = useCallback(() => {
    if (phase === 'idle') {
      setPhase('work')
      setSecondsLeft(workMinutes * 60)
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimer()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [phase, workMinutes, clearTimer])

  const pause = useCallback(() => {
    clearTimer()
    setPhase((p) => (p === 'work' ? 'work' : p))
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setPhase('idle')
    setSecondsLeft(workMinutes * 60)
    setCycle(0)
    setTotalWorkSeconds(0)
  }, [clearTimer, workMinutes])

  // Transition when seconds reach 0
  useEffect(() => {
    if (secondsLeft !== 0) return

    if (phase === 'work') {
      const nextCycle = cycle + 1
      setCycle(nextCycle)
      setTotalWorkSeconds((t) => t + workMinutes * 60)
      onCycleComplete?.(nextCycle)

      if (nextCycle % cyclesBeforeLongBreak === 0) {
        setPhase('long-break')
        setSecondsLeft(longBreakMinutes * 60)
      } else {
        setPhase('break')
        setSecondsLeft(breakMinutes * 60)
      }
    } else if (phase === 'break' || phase === 'long-break') {
      setPhase('work')
      setSecondsLeft(workMinutes * 60)
    }
  }, [secondsLeft, phase, cycle, workMinutes, breakMinutes, longBreakMinutes, cyclesBeforeLongBreak, onCycleComplete, onSessionEnd])

  useEffect(() => () => clearTimer(), [clearTimer])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return {
    phase,
    secondsLeft,
    totalSeconds,
    progress,
    cycle,
    totalWorkSeconds,
    display: formatTime(secondsLeft),
    isRunning: !!intervalRef.current,
    start,
    pause,
    reset,
  }
}
