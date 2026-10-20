import { Vector3 } from 'three';
import type ICollider from '../../Contracts/ICollider.ts';

/** A box rotated around Y: hull plates, walls, steps. */
export default class BoxCollider implements ICollider {
	private readonly _centre: Vector3;
	private readonly _half: Vector3;
	private readonly _cos: number;
	private readonly _sin: number;
	private readonly _local = new Vector3();

	constructor(centre: Vector3, size: Vector3, yaw: number) {
		this._centre = centre.clone();
		this._half = size.clone().multiplyScalar(0.5);
		this._cos = Math.cos(yaw);
		this._sin = Math.sin(yaw);
	}

	public resolve(position: Vector3, radius: number): boolean {
		const dx = position.x - this._centre.x;
		const dz = position.z - this._centre.z;
		// World → box space (inverse yaw)
		this._local.set(dx * this._cos - dz * this._sin, position.y - this._centre.y, dx * this._sin + dz * this._cos);

		const px = this._half.x + radius - Math.abs(this._local.x);
		const py = this._half.y + radius - Math.abs(this._local.y);
		const pz = this._half.z + radius - Math.abs(this._local.z);

		if (px <= 0 || py <= 0 || pz <= 0) {
			return false;
		}

		// Push out along the shallowest axis
		if (px < py && px < pz) {
			this._local.x += Math.sign(this._local.x || 1) * px;
		} else if (py < pz) {
			this._local.y += Math.sign(this._local.y || 1) * py;
		} else {
			this._local.z += Math.sign(this._local.z || 1) * pz;
		}

		position.set(
			this._centre.x + this._local.x * this._cos + this._local.z * this._sin,
			this._centre.y + this._local.y,
			this._centre.z - this._local.x * this._sin + this._local.z * this._cos
		);

		return true;
	}
}
