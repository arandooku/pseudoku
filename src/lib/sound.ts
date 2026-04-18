let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', gain = 0.18, glide?: number) {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (glide !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, glide), ac.currentTime + durMs / 1000);
  }
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + durMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + durMs / 1000 + 0.02);
}

export const sfx = {
  tap: () => tone(520, 50, 'triangle', 0.08),
  place: () => tone(660, 90, 'sine', 0.14),
  correct: () => {
    tone(660, 80, 'sine', 0.14);
    setTimeout(() => tone(880, 110, 'sine', 0.14), 70);
  },
  wrong: () => tone(220, 180, 'sawtooth', 0.16, 120),
  unlock: () => {
    const steps = [523.25, 659.25, 783.99, 1046.5];
    steps.forEach((f, i) => setTimeout(() => tone(f, 180, 'triangle', 0.16), i * 90));
  },
  win: () => {
    const steps = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    steps.forEach((f, i) => setTimeout(() => tone(f, 220, 'sine', 0.18), i * 110));
  },
  fail: () => {
    tone(330, 220, 'sawtooth', 0.18, 90);
    setTimeout(() => tone(220, 280, 'sawtooth', 0.18, 60), 200);
  },
};
