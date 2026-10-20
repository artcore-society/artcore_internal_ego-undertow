import { Vector3 } from 'three';
import type ICollider from '../../Contracts/ICollider.ts';

export default class SphereCollider implements ICollider {
	private readonly _centre: Vector3;
	private readonly _radius: number;
	private readonly _offset = new Vector3();

	constructor(centre: Vector3, radius: number) {
		this._centre = centre.clone();
		this._radius = radius;
	}

	public resolve(position: Vector3, radius: number): boolean {
		const reach = this._radius + radius;
		this._offset.subVectors(position, this._centre);
		const distanceSq = this._offset.lengthSq();

		if (distanceSq >= reach * reach || distanceSq === 0) {
			return false;
		}

		position.copy(this._centre).addScaledVector(this._offset, reach / Math.sqrt(distanceSq));

		return true;
	}
}
