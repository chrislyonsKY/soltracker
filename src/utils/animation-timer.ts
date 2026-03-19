/**
 * requestAnimationFrame-based timer with configurable tick rate.
 * Pauses automatically when the tab is hidden.
 */

type TickCallback = (deltaMs: number) => void;

/**
 * Animation timer that fires tick callbacks at a configurable rate.
 */
export class AnimationTimer {
  private tickCallback: TickCallback | null = null;
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  private accumulator: number = 0;
  private _tickIntervalMs: number;
  private _running: boolean = false;

  constructor(ticksPerSecond: number = 1) {
    this._tickIntervalMs = 1000 / ticksPerSecond;
    this.handleVisibility = this.handleVisibility.bind(this);
    this.loop = this.loop.bind(this);
  }

  /**
   * Register the tick callback.
   * @param callback - Called each tick with elapsed delta in ms
   */
  onTick(callback: TickCallback): void {
    this.tickCallback = callback;
  }

  /**
   * Set the tick rate (ticks per second).
   * @param ticksPerSecond - Number of ticks per second
   */
  setTickRate(ticksPerSecond: number): void {
    this._tickIntervalMs = 1000 / ticksPerSecond;
  }

  /** Start the animation loop. */
  start(): void {
    if (this._running) return;
    this._running = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.rafId = requestAnimationFrame(this.loop);
  }

  /** Stop the animation loop. */
  stop(): void {
    this._running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  /** Whether the timer is currently running. */
  get running(): boolean {
    return this._running;
  }

  private loop(timestamp: number): void {
    if (!this._running) return;

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.accumulator += delta;

    while (this.accumulator >= this._tickIntervalMs) {
      this.accumulator -= this._tickIntervalMs;
      this.tickCallback?.(this._tickIntervalMs);
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  private handleVisibility(): void {
    if (document.hidden) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    } else if (this._running) {
      this.lastTimestamp = performance.now();
      this.accumulator = 0;
      this.rafId = requestAnimationFrame(this.loop);
    }
  }
}
