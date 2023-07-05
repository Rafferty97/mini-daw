export type MidiEvent = MidiNoteEvent | MidiPitchBendEvent

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
