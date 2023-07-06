import { useEffect, useRef } from 'react'
import './Oscilloscope.css'

export interface OscilloscopeProps {
  frames: Float32Array[]
}

export default function Oscilloscope(props: OscilloscopeProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    const rect = { x1: 0, x2: 1600, y1: 100, y2: 500 }
    ctx.clearRect(0, 0, 1600, 600)
    drawSamples(ctx, props.frames, rect)
  }, [props.frames])

  return (
    <canvas
      className="oscilloscope"
      ref={ref}
      width="1600"
      height="600"
    ></canvas>
  )
}

function drawSamples(
  ctx: CanvasRenderingContext2D,
  frames: Float32Array[],
  rect: { x1: number; x2: number; y1: number; y2: number }
) {
  if (frames.length < 1) return
  const { x1, x2, y1, y2 } = rect
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.beginPath()
  const numSamples = frames.length * frames[0].length
  let s = 0
  for (let i = 0; i < frames.length; i++) {
    for (let j = 0; j < frames[0].length; j++) {
      const x = (s / (numSamples - 1)) * (x2 - x1) + x1
      const y = 0.5 * (y1 + y2 + (y1 - y2) * frames[i][j])
      ctx.lineTo(x, y)
      s++
    }
  }
  ctx.stroke()
}
