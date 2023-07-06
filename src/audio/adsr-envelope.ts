import { DEFAULT_SAMPLE_RATE } from './constants'

export interface AdsrOpts {
  attack: number
  decay: number
  sustain: number
  release: number
}

export class AdsrEnvelope {
  _on = false
  initAmp = 0
  sample = 0

  constructor(private opts: AdsrOpts, private rate = DEFAULT_SAMPLE_RATE) {}

  get amplitude() {
    const t = this.sample / this.rate
    if (this._on) {
      // TODO: Decay and sustain
      return Math.min(1, this.initAmp + t / this.opts.attack)
    } else {
      return Math.max(0, this.initAmp - t / this.opts.release)
    }
  }

  get on() {
    return this._on
  }

  set on(on: boolean) {
    if (this._on === on) return
    const amp = this.amplitude
    this._on = on
    this.initAmp = amp
    this.sample = 0
  }

  get active() {
    return this._on || this.amplitude > 0
  }

  advance() {
    this.sample++
  }
}
