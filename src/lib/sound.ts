let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

interface VoiceOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  glide?: number;
  cutoff?: number;
  q?: number;
  attack?: number;
  delay?: number;
}

function voice(o: VoiceOpts) {
  if (muted) return;
  const ac = getCtx();
  if (!ac || !master) return;
  const start = ac.currentTime + (o.delay ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = o.cutoff ?? 2400;
  lp.Q.value = o.q ?? 0.7;
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, start);
  if (o.glide !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.glide), start + o.dur);
  }
  const peak = o.gain ?? 0.18;
  const atk = o.attack ?? 0.006;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, start + o.dur);
  osc.connect(lp).connect(g).connect(master);
  osc.start(start);
  osc.stop(start + o.dur + 0.03);
}

function noiseClick(dur: number, cutoff: number, gain: number) {
  if (muted) return;
  const ac = getCtx();
  if (!ac || !master) return;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = cutoff;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(hp).connect(g).connect(master);
  src.start();
}

export const sfx = {
  tap: () => noiseClick(0.035, 1800, 0.12),
  place: () => voice({ freq: 740, dur: 0.18, type: 'sine', gain: 0.22, cutoff: 2600, attack: 0.004 }),
  correct: () => {
    voice({ freq: 660, dur: 0.22, type: 'sine', gain: 0.2, cutoff: 2400 });
    voice({ freq: 990, dur: 0.28, type: 'sine', gain: 0.18, cutoff: 2800, delay: 0.09 });
  },
  wrong: () => {
    noiseClick(0.05, 600, 0.08);
    voice({ freq: 180, dur: 0.22, type: 'sine', gain: 0.22, glide: 110, cutoff: 900, attack: 0.003 });
  },
  unlock: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => voice({ freq: f, dur: 0.28, type: 'triangle', gain: 0.16, cutoff: 2600, delay: i * 0.08 }));
  },
  win: () => {
    const notes = [523.25, 659.25, 783.99, 987.77, 1318.5];
    notes.forEach((f, i) => voice({ freq: f, dur: 0.34, type: 'sine', gain: 0.2, cutoff: 3000, delay: i * 0.1 }));
  },
  fail: () => {
    voice({ freq: 300, dur: 0.3, type: 'sine', gain: 0.22, glide: 160, cutoff: 1200 });
    voice({ freq: 200, dur: 0.42, type: 'sine', gain: 0.2, glide: 90, cutoff: 900, delay: 0.22 });
  },
};
