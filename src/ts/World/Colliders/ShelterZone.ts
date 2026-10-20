import { Vector3 } from 'three';
import { smoothstep } from '../../Helpers/noise.ts';

/** An enclosed volume (a hull, a sanctum) that keeps the sun out. Box rotated around Y, soft at its edges. */
export default class ShelterZone {
	private static readonly FALLOFF = 3;

	private readonly _centre: Vector3;
	private readonly _half: Vector3;
	private readonly _cos: number;
	private readonly _sin: number;

	constructor(centre: Vector3, size: Vector3, yaw = 0) {
		this._centre = centre.clone();
		this._half = size.clone().multiplyScalar(0.5);
		this._cos = Math.cos(yaw);
		this._sin = Math.sin(yaw);
	}

	/** 1 inside, fading to 0 a few metres outside. */
	public coverAt(point: Vector3): number {
		const dx = point.x - this._centre.x;
		const dz = point.z - this._centre.z;
		const x = dx * this._cos - dz * this._sin;
		const z = dx * this._sin + dz * this._cos;
		const outside = Math.hypot(
			Math.max(0, Math.abs(x) - this._half.x),
			Math.max(0, Math.abs(point.y - this._centre.y) - this._half.y),
			Math.max(0, Math.abs(z) - this._half.z)
		);

		return smoothstep(ShelterZone.FALLOFF, 0, outside);
	}
}
