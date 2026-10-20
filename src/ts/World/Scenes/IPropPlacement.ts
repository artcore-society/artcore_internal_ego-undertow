import type { Euler, Vector3 } from 'three';

/** Where one instance of a model goes. */
export interface IPropPlacement {
	readonly position: Vector3;
	readonly scale: Vector3 | number;
	readonly rotation?: Euler;
	/** Tint multiplied over the model's own colours. */
	readonly color?: string;
}
