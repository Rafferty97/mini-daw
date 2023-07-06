import { MidiEvent } from './midi'
import { Oscillator, OscillatorOpts, frequencyForMidiKey } from './oscillator'

// TODO: Max voices

class MyProcessor extends AudioWorkletProcessor {
  private shape: OscillatorOpts['shape'] = 'sine'
  private voices: {
    key: number
    osc: Oscillator
  }[]
  private bend = 0

  constructor() {
    super()

    this.voices = []

    this.port.onmessage = (e: MessageEvent<MidiEvent>) => {
      if (e.data.kind === 'note') {
        const key = e.data.key
        let voice: (typeof this.voices)[number] | undefined
        const idx = this.voices.findIndex(k => k.key === key)
        if (idx >= 0) {
          voice = this.voices.splice(idx, 1)[0]
        }

        if (e.data.on) {
          if (!voice) {
            voice = {
              key,
              osc: new Oscillator({
                shape: this.shape,
                freq: frequencyForMidiKey(e.data.key),
                amp: (0.3 * e.data.velocity) / 128,
              }),
            }
          }
          voice.osc.on = true
          voice.osc.bend = this.bend
          this.voices.push(voice)
        } else {
          if (!voice) return
          voice.osc.on = false
          voice.osc.bend = this.bend
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
      } else if (e.data.kind === 'control') {
        this.shape = e.data.shape ?? this.shape
      }
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const channelData = outputs[0][0]
    for (let i = 0; i < channelData.length; i++) channelData[i] = 0
    this.voices.forEach(k => k.osc.process(channelData))
    this.voices = this.voices.filter(v => v.osc.active)
    this.port.postMessage(channelData)
    return true
  }
}

registerProcessor('my-processor', MyProcessor)
