/**
 * Sol-by-sol traverse animation engine.
 * TODO(M2): Implement play/pause, speed control, progressive reveal, camera follow
 */
import type { AnimationState, RoverName } from "../../types.ts";

const state: AnimationState = {
  activeRover: "perseverance",
  currentSol: 0,
  maxSol: 0,
  isPlaying: false,
  speed: 1,
  followCamera: true,
};

/** Get current animation state (readonly copy). */
export function getAnimationState(): Readonly<AnimationState> {
  return { ...state };
}

/** Set the active rover for animation. */
export function setActiveRover(_rover: RoverName): void {
  // TODO(M2): Switch rover, reset sol range, update layers
  state.activeRover = _rover;
}

/** Start playback. */
export function play(): void {
  // TODO(M2): Start AnimationTimer, emit sol-change events
  state.isPlaying = true;
}

/** Pause playback. */
export function pause(): void {
  // TODO(M2): Stop AnimationTimer
  state.isPlaying = false;
}

/** Seek to a specific sol. */
export function seekTo(_sol: number): void {
  // TODO(M2): Update definitionExpression, move position marker, emit event
}

/** Step forward one sol. */
export function stepForward(): void {
  // TODO(M2): Increment sol, update display
}

/** Step back one sol. */
export function stepBack(): void {
  // TODO(M2): Decrement sol, update display
}

/** Set playback speed. */
export function setSpeed(_speed: 1 | 5 | 10 | 50): void {
  // TODO(M2): Update AnimationTimer tick rate
  state.speed = _speed;
}
