/**
 * Web Audio API procedural synthesizer for high-urgency Event Engine sound effects.
 * Requires 0 external audio files, operates 100% offline with zero latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * 🚨 High-urgency warble siren for Sudden Crisis events
 */
export function playCrisisAlarm(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  // Rapid pitch oscillation
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.linearRampToValueAtTime(780, now + 0.15);
  osc.frequency.linearRampToValueAtTime(520, now + 0.3);
  osc.frequency.linearRampToValueAtTime(840, now + 0.45);
  osc.frequency.linearRampToValueAtTime(520, now + 0.6);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.7);
}

/**
 * ⚡ Bright fanfare trumpet chord for Gold Rush events
 */
export function playGoldRushFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.2, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.55);
  });
}

/**
 * 🔨 Crisp tactile click/pop for Rapid Tap minigame
 */
export function playRapidTapSound(count = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Pitch shifts up as tap count increases to build excitement
  const baseFreq = 400 + Math.min(count * 25, 600);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.05);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * 🎉 Triumphant major chord chime for Event Victory
 */
export function playVictoryChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major 9th

  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    gain.gain.setValueAtTime(0.18, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.85);
  });
}

/**
 * 💥 Low impact thud for Defeat / Timeout Penalty
 */
export function playDefeatSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.45);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

/**
 * ⏱️ Distinct crisp mechanical ticking sound for rush orders and high-stakes countdowns
 */
export function playClockTickSound(isHigh = false): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  const freq = isHigh ? 1200 : 900;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * 🚨 High-urgency emergency siren sting when a predator raid or blight crisis begins
 */
export function playSirenSting(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Two layered oscillators for dissonant emergency screech
  [660, 880].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.35, now + 0.18);
    osc.frequency.linearRampToValueAtTime(freq * 0.9, now + 0.35);
    osc.frequency.linearRampToValueAtTime(freq * 1.4, now + 0.55);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.68);
  });
}

/**
 * 💰 Satisfying cash register / victory chime on successful crisis defense and wild extraction
 */
export function playCashRegisterSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Initial mechanical slide "ka"
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'triangle';
  clickOsc.frequency.setValueAtTime(1400, now);
  clickOsc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
  clickGain.gain.setValueAtTime(0.18, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.07);

  // 2. High brassy bell chime "ching!"
  const bellFrequencies = [1760, 2637, 3520]; // A6, E7, A7
  bellFrequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + 0.06);

    gain.gain.setValueAtTime(0, now + 0.06);
    gain.gain.linearRampToValueAtTime(0.2 / (i + 1), now + 0.075);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + 0.06);
    osc.stop(now + 0.9);
  });
}

/**
 * 🌾 Gentle confirmation chime for full soil energy hover stamp
 */
export function playSoilEnergyChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const frequencies = [880, 1318.5]; // A5, E6
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.04);

    gain.gain.setValueAtTime(0, now + i * 0.04);
    gain.gain.linearRampToValueAtTime(0.08 / (i + 1), now + i * 0.04 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.04);
    osc.stop(now + i * 0.04 + 0.3);
  });
}

/**
 * 🥀 Subtle alert chime for depleted soil hover warning
 */
export function playTiredSoilAlert(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

