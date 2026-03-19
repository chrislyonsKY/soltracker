/**
 * Sound design — subtle UI audio feedback.
 * Uses Web Audio API to generate tones (no audio files needed).
 * All sounds are optional and respect user preferences.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

/** Lazy-init AudioContext on first user interaction. */
function getAudioCtx(): AudioContext | null {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      soundEnabled = false;
      return null;
    }
  }
  return audioCtx;
}

/**
 * Play a short blip sound (sol tick, button press).
 * @param frequency - Tone frequency in Hz (default 880)
 * @param duration - Duration in seconds (default 0.04)
 */
export function playBlip(frequency: number = 880, duration: number = 0.04): void {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** Play a rising tone (play button). */
export function playStart(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/** Play a falling tone (pause button). */
export function playStop(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/** Play a two-tone chime (rover switch). */
export function playSwitch(): void {
  playBlip(523, 0.06);
  setTimeout(() => playBlip(659, 0.06), 70);
}

/** Toggle sound on/off. */
export function toggleSound(): void {
  soundEnabled = !soundEnabled;
  if (!soundEnabled && audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

/** Check if sound is enabled. */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}
