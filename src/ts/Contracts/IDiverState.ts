import type { Vector3 } from 'three';

/** Read-only view on the diver for cameras, effects and story steps. */
export default interface IDiverState {
	readonly position: Vector3;
	readonly velocity: Vector3;
	/** Radians, 0 = facing -Z. */
	readonly yaw: number;
	/** Metres below the surface. */
	readonly depth: number;
	readonly speed: number;
	/** 0..1 of top sprint speed. */
	readonly speedRatio: number;
	readonly isSprinting: boolean;
}
