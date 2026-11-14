import { useEffect, useRef, useState } from 'react'
import { CoreView } from './components/CoreView.tsx'
import { Hud } from './components/Hud.tsx'
import { DURATION_S } from './model.ts'
import { Explanation } from './components/Explanation.tsx'

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const

export default function App() {
  const timeRef = useRef(0)
  const speedRef = useRef(1)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const sectionedRef = useRef(true)
  const hideBlackRef = useRef(false)
  const [sectioned, setSectioned] = useState(true)
  const [hideBlack, setHideBlack] = useState(false)

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const next = Math.min(DURATION_S, timeRef.current + dt * speedRef.current)
      timeRef.current = next
      setTime(next)
      if (next >= DURATION_S) {
        setRunning(false)
        return
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [running])

  function start() {
    timeRef.current = 0
    setTime(0)
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function resume() {
    if (timeRef.current <= 0 || timeRef.current >= DURATION_S - 0.001) return
    setRunning(true)
  }

  function chooseSpeed(value: number) {
    speedRef.current = value
    setSpeed(value)
  }

  function toggleSection() {
    const next = !sectionedRef.current
    sectionedRef.current = next
    setSectioned(next)
  }

  function toggleBlackRods() {
    const next = !hideBlackRef.current
    hideBlackRef.current = next
    setHideBlack(next)
  }

  return (
    <div className="stage">
      <CoreView timeRef={timeRef} sectionedRef={sectionedRef} hideBlackRef={hideBlackRef} />
      <Hud
        time={time}
        running={running}
        speed={speed}
        speeds={SPEEDS}
        sectioned={sectioned}
        hideBlack={hideBlack}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onSpeed={chooseSpeed}
        onToggleSection={toggleSection}
        onToggleBlackRods={toggleBlackRods}
      />
      <Explanation />
    </div>
  )
}
