import type Viewport from './Viewport.ts';

/**
 * Keeps the frame rate up by trading resolution: watches smoothed frame time and steps the render
 * scale down when frames run long, back up when there is headroom. Hysteresis avoids flip-flopping.
 */
export default class AdaptiveQuality {
	private static readonly LEVELS = [1, 0.85, 0.72, 0.6, 0.5] as const;
	private static readonly SLOW = 1 / 50;
	private static readonly FAST = 1 / 58;
	private static readonly DOWN_AFTER = 1.5;
	private static readonly UP_AFTER = 6;

	private readonly _viewport: Viewport;
	private _level = 0;
	private _average = 1 / 60;
	private _slowTime = 0;
	private _fastTime = 0;
	private _warmup = 2;

	constructor(viewport: Viewport) {
		this._viewport = viewport;
	}

	public get scale(): number {
		return AdaptiveQuality.LEVELS[this._level] ?? 1;
	}

	public update(delta: number): void {
		// Shader warm-up and tab switches produce outliers; ignore the first seconds
		if (this._warmup > 0) {
			this._warmup -= delta;

			return;
		}

		this._average += (delta - this._average) * 0.05;

		if (this._average > AdaptiveQuality.SLOW) {
			this._slowTime += delta;
			this._fastTime = 0;
		} else if (this._average < AdaptiveQuality.FAST) {
			this._fastTime += delta;
			this._slowTime = 0;
		} else {
			this._slowTime = 0;
			this._fastTime = 0;
		}

		if (this._slowTime > AdaptiveQuality.DOWN_AFTER && this._level < AdaptiveQuality.LEVELS.length - 1) {
			this.setLevel(this._level + 1);
		} else if (this._fastTime > AdaptiveQuality.UP_AFTER && this._level > 0) {
			this.setLevel(this._level - 1);
		}
	}

	private setLevel(level: number): void {
		this._level = level;
		this._slowTime = 0;
		this._fastTime = 0;
		this._warmup = 1;
		this._viewport.quality = this.scale;
	}
}
