import audioWorkerUrl from './audio/worker?worker&url'
import './App.css'
import { useEffect } from 'react'
import { MidiNoteEvent, MidiPitchBendEvent } from './audio/midi'

let audioPort: MessagePort | undefined

async function createAudioEngine() {
  const audioContext = new AudioContext()

  await audioContext.audioWorklet.addModule(audioWorkerUrl)

  const myAudioWorkletNode = new AudioWorkletNode(audioContext, 'my-processor')
  audioPort = myAudioWorkletNode.port

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

function App() {
  useEffect(() => {
    midi()
  }, [])
  return (
    <>
      <div className="card">
        <button onClick={() => createAudioEngine()}>Start</button>
      </div>
    </>
  )
}

export default App
