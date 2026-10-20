import { Color } from 'three';
import type IEnvironmentState from '../Contracts/IEnvironmentState.ts';

export type MutableEnvironment = { -readonly [TKey in keyof IEnvironmentState]: IEnvironmentState[TKey] };

export function createEnvironment(): MutableEnvironment {
	return {
		waterColor: new Color(),
		downwellColor: new Color(),
		fogDensity: 0,
		sunIntensity: 0,
		ambientIntensity: 0,
		caustics: 0,
		godRays: 0,
		particles: 0,
		exposure: 1,
		bloomStrength: 0
	};
}

/** Allocation-free blend of two environment states into `target`. */
export function lerpEnvironment(
	target: MutableEnvironment,
	from: IEnvironmentState,
	to: IEnvironmentState,
	t: number
): MutableEnvironment {
	target.waterColor.copy(from.waterColor).lerp(to.waterColor, t);
	target.downwellColor.copy(from.downwellColor).lerp(to.downwellColor, t);
	target.fogDensity = from.fogDensity + (to.fogDensity - from.fogDensity) * t;
	target.sunIntensity = from.sunIntensity + (to.sunIntensity - from.sunIntensity) * t;
	target.ambientIntensity = from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * t;
	target.caustics = from.caustics + (to.caustics - from.caustics) * t;
	target.godRays = from.godRays + (to.godRays - from.godRays) * t;
	target.particles = from.particles + (to.particles - from.particles) * t;
	target.exposure = from.exposure + (to.exposure - from.exposure) * t;
	target.bloomStrength = from.bloomStrength + (to.bloomStrength - from.bloomStrength) * t;

	return target;
}
