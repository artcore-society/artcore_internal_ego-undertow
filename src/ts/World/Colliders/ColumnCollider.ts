import type { Vector3 } from 'three';
import type ICollider from '../../Contracts/ICollider.ts';

/** A vertical cylinder: columns, statues, towers. */
export default class ColumnCollider implements ICollider {
	private readonly _x: number;
	private readonly _z: number;
	private readonly _radius: number;
	private readonly _bottom: number;
	private readonly _top: number;

	constructor(x: number, z: number, radius: number, bottom: number, top: number) {
		this._x = x;
		this._z = z;
		this._radius = radius;
		this._bottom = bottom;
		this._top = top;
	}

	public resolve(position: Vector3, radius: number): boolean {
		if (position.y < this._bottom - radius || position.y > this._top + radius) {
			return false;
		}

		const dx = position.x - this._x;
		const dz = position.z - this._z;
		const reach = this._radius + radius;
		const distance = Math.hypot(dx, dz);

		if (distance >= reach || distance === 0) {
			return false;
		}

		// Close to the top: easier to slide over than around
		if (position.y > this._top) {
			position.y = this._top + radius;

			return true;
		}

		position.x = this._x + (dx / distance) * reach;
		position.z = this._z + (dz / distance) * reach;

		return true;
	}
}
