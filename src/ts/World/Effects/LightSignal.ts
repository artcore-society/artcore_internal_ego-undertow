/**
 * Call and response near the end: the diver's lamp flickers three times, and a moment later Mara's
 * light pulses three times back. Repeats while it lasts; only timing, the lamp and the heart do the rest.
 */
export default class LightSignal {
	private static readonly CYCLE = 6;
	/** Seconds into the cycle of each of the three flashes, for the call and then the answer. */
	private static readonly CALL = [0.2, 0.55, 0.9];
	private static readonly ANSWER = [2.2, 2.55, 2.9];
	private static readonly FLASH = 0.16;

	private _time = 0;
	private _isActive = false;
	private _call = 0;
	private _answer = 0;

	/** 0..1 how bright the diver's lamp flashes now. */
	public get call(): number {
		return this._call;
	}

	/** 0..1 how bright Mara's light flashes back now. */
	public get answer(): number {
		return this._answer;
	}

	public update(isActive: boolean, delta: number): void {
		if (isActive && !this._isActive) {
			this._time = 0;
		}

		this._isActive = isActive;
		this._time = isActive ? (this._time + delta) % LightSignal.CYCLE : 0;
		this._call = isActive ? LightSignal.flashes(LightSignal.CALL, this._time) : 0;
		this._answer = isActive ? LightSignal.flashes(LightSignal.ANSWER, this._time) : 0;
	}

	private static flashes(at: readonly number[], time: number): number {
		return at.reduce((level, start) => {
			const t = (time - start) / LightSignal.FLASH;

			return t >= 0 && t <= 1 ? Math.max(level, Math.sin(t * Math.PI)) : level;
		}, 0);
	}
}
