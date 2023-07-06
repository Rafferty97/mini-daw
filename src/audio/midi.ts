import { OscillatorOpts } from './oscillator'

export type MidiEvent = MidiNoteEvent | MidiPitchBendEvent | ControlEvent

export interface MidiNoteEvent {
  kind: 'note'
  on: boolean
  key: number
  velocity: number
}

export interface MidiPitchBendEvent {
  kind: 'bend'
  bend: number
}

export interface ControlEvent {
  kind: 'control'
  shape?: OscillatorOpts['shape']
}
