import audioWorkerUrl from './audio/worker?worker&url'
import './App.css'
import { useCallback, useEffect, useState } from 'react'
import { ControlEvent, MidiNoteEvent, MidiPitchBendEvent } from './audio/midi'
import { OscillatorOpts } from './audio/oscillator'
import Oscilloscope from './Oscilloscope'

let audioPort: MessagePort | undefined

async function createAudioEngine(onFrames: (frames: Float32Array[]) => void) {
  const audioContext = new AudioContext()

  await audioContext.audioWorklet.addModule(audioWorkerUrl)

  const myAudioWorkletNode = new AudioWorkletNode(audioContext, 'my-processor')
  audioPort = myAudioWorkletNode.port

  let frames: Float32Array[] = []
  audioPort.onmessage = (ev: MessageEvent<Float32Array>) => {
    frames = frames.slice(Math.max(0, frames.length - 100))
    frames.push(ev.data)
    onFrames(frames)
  }

  myAudioWorkletNode.connect(audioContext.destination)
}

function midi() {
  let midi = null // global MIDIAccess object
  function onMIDISuccess(midiAccess: MIDIAccess) {
    console.log('MIDI ready!')
    midi = midiAccess // store in the global (in real usage, would probably keep in an object instance)
    startLoggingMIDIInput(midi)
  }

  function onMIDIFailure(msg: Error) {
    console.error(`Failed to get MIDI access - ${msg}`)
  }

  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
}

function startLoggingMIDIInput(midiAccess: MIDIAccess) {
  midiAccess.inputs.forEach(entry => {
    entry.onmidimessage = onMIDIMessage as unknown as (ev: Event) => void // FIXME
  })
}

function onMIDIMessage(event: MIDIMessageEvent) {
  if (event.data[0] >> 5 === 0b100) {
    const msg: MidiNoteEvent = {
      kind: 'note',
      on: !!(event.data[0] & 16),
      key: event.data[1],
      velocity: event.data[2],
    }
    audioPort?.postMessage(msg)
  }
  if (event.data[0] >> 4 === 0b1110) {
    const msg: MidiPitchBendEvent = {
      kind: 'bend',
      bend: (event.data[1] + (event.data[2] << 7)) / 8192 - 1,
    }
    audioPort?.postMessage(msg)
  }
}

function setShape(shape: OscillatorOpts['shape']) {
  const msg: ControlEvent = {
    kind: 'control',
    shape,
  }
  audioPort?.postMessage(msg)
}

function App() {
  const [frames, setFrames] = useState<Float32Array[]>([])

  useEffect(() => {
    midi()
  }, [])

  const start = () => {
    createAudioEngine(setFrames)
  }

  return (
    <>
      <div className="card">
        <Oscilloscope frames={frames} />
        <button onClick={start}>Start</button>
        <button onClick={() => setShape('sine')}>SINE</button>
        <button onClick={() => setShape('square')}>SQUARE</button>
        <button onClick={() => setShape('saw')}>SAW</button>
        <button onClick={() => setShape('tri')}>TRI</button>
      </div>
    </>
  )
}

export default App
