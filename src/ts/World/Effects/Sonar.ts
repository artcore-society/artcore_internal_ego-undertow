import type { Vector3 } from 'three';
import type WaterUniforms from '../Water/WaterUniforms.ts';

/**
 * The diver's sonar: a ring of light sweeps out from where it was sent, outlining rocks, wreckage and
 * creatures as it passes (drawn by the caustics patch every lit material already has: no extra pass).
 */
export default class Sonar {
	private static readonly SPEED = 35;
	private static readonly REACH = 75;
	/** Seconds before it can ping again. */
	private static readonly COOLDOWN = 3;

	private readonly _water: WaterUniforms;
	private _cooldown = 0;

	constructor(water: WaterUniforms) {
		this._water = water;
	}

	/** @returns whether it pinged (not while it's still recharging) */
	public ping(from: Readonly<Vector3>): boolean {
		if (this._cooldown > 0) {
			return false;
		}

		this._water.pingOrigin.value.copy(from);
		this._water.pingRadius.value = 0.01;
		this._cooldown = Sonar.COOLDOWN;

		return true;
	}

	public update(delta: number): void {
		this._cooldown = Math.max(0, this._cooldown - delta);

		const radius = this._water.pingRadius;

		if (radius.value > 0) {
			radius.value = radius.value + delta * Sonar.SPEED;

			if (radius.value > Sonar.REACH) {
				radius.value = -1;
			}
		}
	}
}
