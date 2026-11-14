import { LATTICE_COUNTS } from '../data/lattice.ts'
import {
  DURATION_S,
  JOLT_S,
  SPEED_M_PER_S,
  illustrativeReactivity,
  phaseAt,
  type Phase,
} from '../model.ts'

const displacerCount = LATTICE_COUNTS.RR + LATTICE_COUNTS.AZ + LATTICE_COUNTS.LAR

function describe(phase: Phase, reactivity: number): string {
  const direction = reactivity > 0.02 ? '曲线在零以上。' : reactivity < -0.02 ? '曲线在零以下。' : '曲线在零附近。'
  switch (phase) {
    case 'ready':
      return '全部从抽出位置起算。带挤水棒的棒，石墨在堆芯中部，下面约 1.25 m 是水，吸收体还在堆芯之上。按开始，看它们一起下插。'
    case 'displacing':
      return `石墨正在进入下部水柱，吸收体还没有到这一区。${direction}`
    case 'inserting':
      return `下部的水已经被石墨换过。吸收体继续向下。${direction}`
    case 'covered':
      return `按这张示意图，顶部插入的吸收体已经盖住堆芯高度。${direction}`
  }
}

export function Hud({
  time,
  running,
  speed,
  speeds,
  onStart,
  onPause,
  onResume,
  onSpeed,
  sectioned,
  hideBlack,
  onToggleSection,
  onToggleBlackRods,
}: {
  time: number
  running: boolean
  speed: number
  speeds: readonly number[]
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onSpeed: (speed: number) => void
  sectioned: boolean
  hideBlack: boolean
  onToggleSection: () => void
  onToggleBlackRods: () => void
}) {
  const reactivity = illustrativeReactivity(time)
  const phase = phaseAt(time)
  const paused = !running && time > 0.05 && time < DURATION_S - 0.001
  const finished = !running && time >= DURATION_S - 0.001
  const startLabel = time <= 0.05 ? '开始 AZ-5' : finished ? '再看一次' : '从头开始'
  const samples = 90
  const points: string[] = []
  for (let i = 0; i <= samples; i++) {
    const t = (DURATION_S * i) / samples
    const x = 8 + (t / DURATION_S) * 224
    const y = 46 - illustrativeReactivity(t) * 28
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const playX = 8 + (time / DURATION_S) * 224

  return (
    <>
      <header className="topbar">
        <div>
          <p className="kicker">RBMK-1000 · Unit 4 · AZ-5</p>
          <h1>全堆控制棒的下插</h1>
        </div>
        <div className="transport">
          <div className="speeds" role="group" aria-label="播放倍速">
            {speeds.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={speed === value}
                onClick={() => onSpeed(value)}
              >
                {value === 0.25 ? '0.25×' : `${value}×`}
              </button>
            ))}
          </div>
          <button type="button" className="quiet" onClick={onToggleSection} aria-pressed={sectioned}>
            {sectioned ? '剖面' : '非剖面'}
          </button>
          <button type="button" className="quiet" onClick={onToggleBlackRods} aria-pressed={hideBlack}>
            {hideBlack ? '显示控制棒' : '隐藏控制棒'}
          </button>
          <button type="button" className="quiet" onClick={onPause} disabled={!running}>
            暂停
          </button>
          <button type="button" className="quiet" onClick={onResume} disabled={!paused}>
            继续
          </button>
          <button type="button" className="start" onClick={onStart} disabled={running}>
            {running ? '插入中' : startLabel}
          </button>
        </div>
      </header>
      <aside className="panel">
        <p className="clock">
          <span>{time.toFixed(1)}</span>
          <small>s / {DURATION_S}</small>
        </p>
        <p className={`phase ${reactivity > 0.02 ? 'positive' : reactivity < -0.02 ? 'negative' : ''}`}>
          {paused ? '已暂停，棒停在当前位置。' : ''}
          {describe(phase, reactivity)}
        </p>
        <svg className="spark" viewBox="0 0 240 78" role="img" aria-label="全部挤水棒共用的定性反应性示意">
          <text x="8" y="12" fontSize="11">
            定性反应性 · 任意单位
          </text>
          <line x1="8" x2="232" y1="46" y2="46" stroke="#241f1a" strokeWidth="1" />
          <rect x="8" y="18" width={(JOLT_S / DURATION_S) * 224} height="52" fill="rgba(156,59,50,0.18)" />
          <polyline points={points.join(' ')} fill="none" stroke="#241f1a" strokeWidth="1.6" />
          <line x1={playX} x2={playX} y1="18" y2="70" stroke="#9c3b32" strokeWidth="1" />
        </svg>
        <p className="note">
          这条曲线只跟着带石墨挤水棒的顶部棒。它们一起动，所以全堆共用一条示意，不是功率计算。正项是置换窗口上的 sin² 脉冲，负项是吸收体进入堆芯的比例。
        </p>
        <dl className="counts">
          <div>
            <dt>带挤水棒、一起下插</dt>
            <dd>{displacerCount}</dd>
          </div>
          <div>
            <dt>AR，无挤水棒</dt>
            <dd>{LATTICE_COUNTS.AR}</dd>
          </div>
          <div>
            <dt>USP，从下方进入</dt>
            <dd>{LATTICE_COUNTS.USP}</dd>
          </div>
          <div>
            <dt>燃料通道</dt>
            <dd>{LATTICE_COUNTS.fuel}</dd>
          </div>
        </dl>
        <ul className="legend">
          <li><i className="swatch rr" /> RR / AZ / LAR · B₄C 与石墨</li>
          <li><i className="swatch ar" /> AR · 只有吸收体</li>
          <li><i className="swatch usp" /> USP · 短棒，自下而上</li>
          <li><i className="swatch fuel" /> 燃料通道</li>
          <li><i className="swatch water" /> 下部水柱，在跳动时变红</li>
        </ul>
        <p className="note">
          1× 是棒的物理速度，约 {SPEED_M_PER_S} m/s。加快或放慢只改变观看快慢，不改这个 1×。暂停停在当前棒位，继续从那里接着走。
        </p>
      </aside>
    </>
  )
}
