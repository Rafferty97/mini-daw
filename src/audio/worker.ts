import { MidiEvent } from './midi'
import { Oscillator, frequencyForMidiKey } from './oscillator'

class MyProcessor extends AudioWorkletProcessor {
  private voices: {
    key: number
    osc: Oscillator
  }[]
  private bend = 0

  constructor() {
    super()

    this.voices = []
    for (let i = 0; i < 8; i++) {
      this.voices.push({
        key: 0,
        osc: new Oscillator({ shape: 'sine', amp: 0, freq: 0 }),
      })
    }

    this.port.onmessage = (e: MessageEvent<MidiEvent>) => {
      if (e.data.kind === 'note') {
        const key = e.data.key
        if (e.data.on) {
          let idx = this.voices.findIndex(k => k.key === key)
          if (idx < 0) {
            idx = 0
            this.voices[idx].key = e.data.key
            this.voices[idx].osc = new Oscillator({
              shape: 'square',
              freq: frequencyForMidiKey(e.data.key),
              amp: (0.3 * e.data.velocity) / 128,
            })
            this.voices[idx].osc.bend = this.bend
          }
          if (this.voices[idx].osc.on) return
          this.voices[idx].osc.on = true
          const [voice] = this.voices.splice(idx, 1)
          this.voices.push(voice)
        } else {
          const idx = this.voices.findIndex(k => k.key === key)
          if (idx < 0) return
          if (!this.voices[idx].osc.on) return
          this.voices[idx].osc.on = false
          const [voice] = this.voices.splice(idx, 1)
          const firstOn = this.voices.findIndex(k => k.osc.on)
          this.voices.splice(
            firstOn < 0 ? this.voices.length : firstOn,
            0,
            voice
          )
        }
        // console.log(this.keys.map(k => (k.osc.on ? '1' : '0')).join(' '))
      } else if (e.data.kind === 'bend') {
        this.bend = e.data.bend
        this.voices.forEach(k => (k.osc.bend = this.bend))
      }
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const channelData = outputs[0][0]
    for (let i = 0; i < channelData.length; i++) channelData[i] = 0
    this.voices.forEach(k => k.osc.process(channelData))
    return true
  }
}

registerProcessor('my-processor', MyProcessor)
