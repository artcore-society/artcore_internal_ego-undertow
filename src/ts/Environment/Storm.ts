export interface IStrike {
	/** Direction to the strike on the horizontal plane, radians. */
	readonly azimuth: number;
	/** Metres to where it hits the water. */
	readonly distance: number;
	/** Varies the bolt's shape. */
	readonly seed: number;
}

/**
 * The storm overhead. Lightning strikes at random intervals, often as a double flicker; the flash
 * reaches down through the water, fading with depth. Thunder follows, later the further the strike.
 */
export default class Storm {
	private static readonly DECAY = 3.2;
	/** Depth (m) at which the flash has faded to a third. */
	private static readonly REACH = 55;

	private _flash = 0;
	private _isCalm = false;
	private _timer = 4;
	private _echo = -1;
	private _onStrike: ((strike: IStrike) => void) | null = null;
	private _strike: IStrike = { azimuth: 0, distance: 1000, seed: 0 };

	/** 0..1 brightness of the lightning at the current depth. */
	public get flash(): number {
		return this._flash;
	}

	/** The latest strike. */
	public get strike(): IStrike {
		return this._strike;
	}

	/** The storm passes: no more strikes. */
	public calm(isCalm = true): void {
		this._isCalm = isCalm;
	}

	public onStrike(listener: (strike: IStrike) => void): void {
		this._onStrike = listener;
	}

	public update(depth: number, delta: number): void {
		const reach = Math.exp(-Math.max(0, depth) / Storm.REACH);

		this._flash = Math.max(0, this._flash - delta * Storm.DECAY);
		this._timer -= delta;

		if (this._echo >= 0) {
			this._echo -= delta;

			if (this._echo < 0) {
				this._flash = Math.max(this._flash, 0.7 * reach);
			}
		}

		if (this._timer > 0 || this._isCalm) {
			return;
		}

		this._timer = 7 + Math.random() * 12;
		this._flash = (0.6 + Math.random() * 0.4) * reach;
		this._echo = Math.random() < 0.6 ? 0.08 + Math.random() * 0.12 : -1;
		// Some strikes land close enough to see where they hit the water
		const distance = Math.random() < 0.35 ? 25 + Math.random() * 60 : 200 + Math.random() * 1600;
		this._strike = { azimuth: Math.random() * Math.PI * 2, distance, seed: Math.random() * 100 };
		this._onStrike?.(this._strike);
	}
}
