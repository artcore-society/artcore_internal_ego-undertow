import type { Color } from 'three';

/** Everything the water looks like at one depth. Blended per frame, pushed to IEnvironmentAware systems. */
export default interface IEnvironmentState {
	/** Fog and background. */
	readonly waterColor: Color;
	/** Hemisphere sky colour: light coming down through the water. */
	readonly downwellColor: Color;
	readonly fogDensity: number;
	readonly sunIntensity: number;
	readonly ambientIntensity: number;
	/** 0..1 sunlight caustics on everything. */
	readonly caustics: number;
	/** 0..1 visible light shafts. */
	readonly godRays: number;
	/** Marine snow brightness. */
	readonly particles: number;
	readonly exposure: number;
	readonly bloomStrength: number;
}
