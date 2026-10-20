/** Deterministic mulberry32 PRNG so the world layout is identical every session. */
export default class SeededRandom {
	private _state: number;

	constructor(seed: number) {
		this._state = seed >>> 0;
	}

	public next(): number {
		this._state = (this._state + 0x6d2b79f5) >>> 0;
		let t = this._state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	public range(min: number, max: number): number {
		return min + (max - min) * this.next();
	}
}
