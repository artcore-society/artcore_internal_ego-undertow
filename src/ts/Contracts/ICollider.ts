import type { Vector3 } from 'three';

export default interface ICollider {
	/** Pushes a sphere at `position` out of the collider; returns true on contact. */
	resolve(position: Vector3, radius: number): boolean;
}
