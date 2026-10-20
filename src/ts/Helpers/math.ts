import { MathUtils, Vector3 } from 'three';

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, delta: number): number {
	return MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta));
}

export function dampVector3(current: Vector3, target: Vector3, lambda: number, delta: number): Vector3 {
	return current.lerp(target, 1 - Math.exp(-lambda * delta));
}

/** Smoothly interpolate between angles, taking the shortest path. */
export function dampAngle(current: number, target: number, lambda: number, delta: number): number {
	const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));

	return current + difference * (1 - Math.exp(-lambda * delta));
}

export function directionFromSpherical(elevationDeg: number, azimuthDeg: number, target: Vector3): Vector3 {
	const phi = MathUtils.degToRad(90 - elevationDeg);
	const theta = MathUtils.degToRad(azimuthDeg);

	return target.setFromSphericalCoords(1, phi, theta);
}

export function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
