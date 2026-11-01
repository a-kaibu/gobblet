import type { MoveRecord } from "../game/types";

export type SoundName =
  | "place"
  | "gobble"
  | "move"
  | "select"
  | "invalid"
  | "undo"
  | "win"
  | "draw";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioContextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextConstructor) return null;

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  duration: number;
  delay?: number;
  gain?: number;
  type?: OscillatorType;
}

function tone(context: AudioContext, options: ToneOptions): void {
  const { frequency, endFrequency, duration, delay = 0, gain = 0.08, type = "sine" } = options;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  }

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

interface NoiseOptions {
  duration?: number;
  delay?: number;
  gain?: number;
  frequency?: number;
}

function noise(context: AudioContext, options: NoiseOptions = {}): void {
  const { duration = 0.04, delay = 0, gain = 0.05, frequency = 900 } = options;
  const start = context.currentTime + delay;
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(gain, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(envelope).connect(context.destination);
  source.start(start);
}

function playTone(name: SoundName, context: AudioContext): void {
  switch (name) {
    case "place":
      noise(context, { frequency: 850, duration: 0.045, gain: 0.06 });
      tone(context, {
        frequency: 230,
        endFrequency: 150,
        duration: 0.1,
        gain: 0.13,
      });
      break;
    case "gobble":
      noise(context, { frequency: 520, duration: 0.07, gain: 0.08 });
      tone(context, {
        frequency: 170,
        endFrequency: 82,
        duration: 0.18,
        gain: 0.17,
      });
      break;
    case "move":
      noise(context, { frequency: 1050, duration: 0.035, gain: 0.05 });
      tone(context, {
        frequency: 310,
        endFrequency: 210,
        duration: 0.08,
        gain: 0.09,
        type: "triangle",
      });
      break;
    case "select":
      tone(context, {
        frequency: 880,
        endFrequency: 920,
        duration: 0.035,
        gain: 0.035,
      });
      break;
    case "invalid":
      tone(context, {
        frequency: 120,
        endFrequency: 90,
        duration: 0.09,
        gain: 0.05,
      });
      break;
    case "undo":
      tone(context, {
        frequency: 480,
        endFrequency: 360,
        duration: 0.08,
        gain: 0.05,
      });
      tone(context, {
        frequency: 330,
        endFrequency: 240,
        duration: 0.11,
        delay: 0.07,
        gain: 0.04,
      });
      break;
    case "win": {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((frequency, index) => {
        tone(context, {
          frequency,
          duration: 0.22,
          delay: index * 0.085,
          gain: 0.075,
          type: "triangle",
        });
      });
      tone(context, {
        frequency: 130.81,
        endFrequency: 98,
        duration: 0.7,
        delay: 0.05,
        gain: 0.09,
      });
      break;
    }
    case "draw":
      tone(context, {
        frequency: 392,
        duration: 0.18,
        gain: 0.05,
        type: "triangle",
      });
      tone(context, {
        frequency: 329.63,
        duration: 0.24,
        delay: 0.16,
        gain: 0.045,
        type: "triangle",
      });
      break;
  }
}

export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;
  playTone(name, context);
}

export function playMoveSound(record: MoveRecord, enabled: boolean): void {
  if (!enabled) return;
  if (record.gobbled) {
    playSound("gobble", true);
  } else if (record.move.type === "place") {
    playSound("place", true);
  } else {
    playSound("move", true);
  }
}
