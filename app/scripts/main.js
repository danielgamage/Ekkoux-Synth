var context = new (window.AudioContext || window.webkitAudioContext)()

var volumeNode = context.createGain()
var gainNodeOsc = context.createGain()

// create Oscillator node
var osc1 = context.createOscillator()
osc1.type = 'sawtooth'
osc1.frequency.value = 33.7

var osc2 = context.createOscillator()
osc2.type = 'sawtooth'
osc2.frequency.value = 32.7

var notchFilter = context.createBiquadFilter()
notchFilter.type = "notch"
notchFilter.frequency.value = 20000
notchFilter.Q.value = 0.001

var lowpassFilter = context.createBiquadFilter()
notchFilter.type = "lowpass"
notchFilter.frequency.value = 24000
notchFilter.Q.value = 0.5

const eq = [
	{
		type: 'highpass',
		freq: 114,
		gain: 0,
		Q: 0.25
	},
	{
		type: 'peaking',
		freq: 601,
		gain: -5.33,
		Q: 0.71
	},
	{
		type: 'peaking',
		freq: 3410,
		gain: -8.8,
		Q: 0.52
	},
	{
		type: 'lowpass',
		freq: 6960,
		gain: 0,
		Q: 0.28
	}
]

const eqList = eq.map((eq, i) => {
	const eqNode = context.createBiquadFilter()
	eqNode.type = eq.type
	eqNode.frequency.value = eq.freq
	eqNode.gain.value = eq.gain
	eqNode.Q.value = eq.Q
	return (eqNode)
})

function connectGroup(group, nextNode) {
	group.map((eq, i) => {
		if (i !== group.length - 1) {
			eq.connect(group[(i + 1)])
		} else {
			eq.connect(nextNode)
		}
	})
}

connectGroup(eqList, volumeNode)

osc1.connect(notchFilter)
osc1.start()
osc2.connect(gainNodeOsc)
osc2.start()
gainNodeOsc.connect(notchFilter)
notchFilter.connect(lowpassFilter)
lowpassFilter.connect(eqList[0])
volumeNode.connect(context.destination)

const adjustGain = function(el) {
	const value = el.value / 100
	volumeNode.gain.value = value
}
const adjustOsc = function(el) {
	const value = el.value / 100
	gainNodeOsc.gain.value = value
}
const adjustEQ = function(el) {
	const value = el.value
	notchFilter.frequency.value = value
}
const adjustFreq = function(freq) {
	osc1.frequency.value = freq
	osc2.frequency.value = freq * 1.005 + 1
}

const chordArray = [
	0,
	2,
	-15,
	17,
	19,
	-3
]
const root = 110
let current = 0
function findNote(baseNote, steps) {
	return ( baseNote * Math.pow(Math.pow(2, (1/12)), steps) )
}

function changeNote() {
	const newNote = findNote(root, chordArray[current])
	adjustFreq(newNote)
	if (current !== chordArray.length - 1) {
		current++
	} else {
		current = 0
	}
}

function handleMotion(event) {
	const acc = event.acceleration
	const value = Math.floor(acc.z) + 0.001
	if (volumeNode.gain.value < value) {
		volumeNode.gain.value = value
	} else {
		volumeNode.gain.setTargetAtTime(0.001, context.currentTime, 0.2);
	}
	monitor.style.backgroundColor = `hsl(0,100%,${value + 20}%)`
	// console.log(volumeNode.gain.value)
}

function handleOrientation(event) {
	const pitch = Math.min(90, Math.max(0.5, event.beta))
	const freq = pitch * 250;
	lowpassFilter.frequency.value = freq;
	// monitor.style.backgroundColor = `hsl(0,100%,${value / 20 + 20}%)`
	// console.log(volumeNode.gain.value)
}

const volumeEl  = document.querySelector('input.volume')
const osc2AmtEl = document.querySelector('input.osc2Amt')
const oscFreqEl = document.querySelector('input.oscFreq')
const eqFreqEl  = document.querySelector('input.eqFreq')
const noteEl    = document.querySelector('.note')
const logger    = document.querySelector('.log')
const monitor   = document.querySelector('output.volume')

volumeEl.addEventListener('input', () => adjustGain(volumeEl))
osc2AmtEl.addEventListener('input', () => adjustOsc(osc2AmtEl))
oscFreqEl.addEventListener('input', () => adjustFreq(oscFreqEl.value))
// eqFreqEl.addEventListener('input', () => adjustEQ(eqFreqEl))
noteEl.addEventListener('mousedown', () => changeNote())

window.addEventListener("deviceorientation", handleOrientation, true);
// window.addEventListener("devicemotion", handleMotion, true);
