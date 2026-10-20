import { OXYGEN_CONFIG } from '../Config/dive.ts';

/** Air in the tank, 0..1. Drains faster deep down and when sprinting; refills in air columns. */
export default class OxygenTank {
	public isInfinite = false;

	private _level = 1;

	public get level(): number {
		return this._level;
	}

	public get isLow(): boolean {
		return !this.isInfinite && this._level < OXYGEN_CONFIG.lowThreshold;
	}

	public get isEmpty(): boolean {
		return !this.isInfinite && this._level <= 0;
	}

	public refill(amount = 1): void {
		this._level = Math.min(1, this._level + amount);
	}

	public update(depth: number, isSprinting: boolean, inAir: boolean, delta: number): void {
		if (inAir) {
			this._level = Math.min(1, this._level + OXYGEN_CONFIG.refillRate * delta);

			return;
		}

		if (this.isInfinite) {
			return;
		}

		const rate = (1 + depth * OXYGEN_CONFIG.depthFactor) * (isSprinting ? OXYGEN_CONFIG.sprintFactor : 1);
		this._level = Math.max(0, this._level - (rate * delta) / OXYGEN_CONFIG.capacity);
	}
}
