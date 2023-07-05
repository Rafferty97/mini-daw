import { AdsrEnvelope } from './adsr-envelope'
import { DEFAULT_SAMPLE_RATE } from './constants'

export interface OscillatorOpts {
  shape: 'sine' | 'square'
  freq: number
  amp: number
}

export class Oscillator {
  private o: (angle: number) => number
  private s: number
  private a: number
  private _on = false
  private envelope = new AdsrEnvelope({
    attack: 0.05,
    decay: 0,
    sustain: 1,
    release: 0.05,
  })
  private phase = 0
  private _bend = 1

  constructor(opts: OscillatorOpts, rate = DEFAULT_SAMPLE_RATE) {
    switch (opts.shape) {
      case 'sine':
        this.o = Math.sin
        break
      case 'square':
        this.o = a => Math.sign(Math.sin(a))
        break
    }
    this.s = (2 * Math.PI * opts.freq) / rate
    this.a = opts.amp
  }

  process(output: Float32Array) {
    for (let i = 0; i < output.length; i++) {
      const amp = this.a * this.envelope.amplitude
      output[i] += amp * this.o(this.phase + this._bend * this.s * i)
      this.envelope.advance()
    }
    this.phase += this._bend * this.s * output.length
    this.phase = this.phase % (2 * Math.PI)
  }

  get on() {
    return this._on
  }

  set on(on: boolean) {
    this._on = on
    this.envelope.on = on
  }

  set bend(bend: number) {
    this._bend = relativeFrequencyForMidiKey(bend)
  }
}

export function frequencyForMidiKey(key: number): number {
  return 440 * relativeFrequencyForMidiKey(key - 69)
}

export function relativeFrequencyForMidiKey(key: number): number {
  return Math.pow(2, key / 12)
}
