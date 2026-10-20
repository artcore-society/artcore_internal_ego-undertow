import { Color } from 'three';
import type IEnvironmentState from '../Contracts/IEnvironmentState.ts';

export interface IDepthStop {
	readonly depth: number;
	readonly state: IEnvironmentState;
}

function state(
	values: Omit<IEnvironmentState, 'waterColor' | 'downwellColor'> & { water: string; downwell: string }
): IEnvironmentState {
	const { water, downwell, ...rest } = values;

	return { ...rest, waterColor: new Color(water), downwellColor: new Color(downwell) };
}

/** Light dies with depth under a storm: grey-green murk → blue twilight → black. Sorted by depth. */
export const DEPTH_STOPS: readonly IDepthStop[] = [
	{
		depth: 0,
		state: state({
			water: '#1e5a6b',
			downwell: '#9cc6d0',
			fogDensity: 0.03,
			sunIntensity: 1.25,
			ambientIntensity: 0.85,
			caustics: 0.6,
			godRays: 0.7,
			particles: 0.9,
			exposure: 0.95,
			bloomStrength: 0.45
		})
	},
	{
		depth: 28,
		state: state({
			water: '#123d4f',
			downwell: '#6a9fb0',
			fogDensity: 0.034,
			sunIntensity: 0.75,
			ambientIntensity: 0.6,
			caustics: 0.38,
			godRays: 0.45,
			particles: 0.9,
			exposure: 1.0,
			bloomStrength: 0.5
		})
	},
	{
		depth: 52,
		state: state({
			water: '#0a2636',
			downwell: '#3f7690',
			fogDensity: 0.036,
			sunIntensity: 0.32,
			ambientIntensity: 0.42,
			caustics: 0.12,
			godRays: 0.18,
			particles: 0.85,
			exposure: 1.1,
			bloomStrength: 0.6
		})
	},
	{
		depth: 100,
		state: state({
			water: '#04131e',
			downwell: '#21516b',
			fogDensity: 0.036,
			sunIntensity: 0.08,
			ambientIntensity: 0.32,
			caustics: 0.0,
			godRays: 0.04,
			particles: 0.7,
			exposure: 1.2,
			bloomStrength: 0.8
		})
	},
	{
		depth: 165,
		state: state({
			water: '#020a12',
			downwell: '#1a4560',
			fogDensity: 0.027,
			sunIntensity: 0.03,
			ambientIntensity: 0.4,
			caustics: 0.0,
			godRays: 0.0,
			particles: 0.6,
			exposure: 1.3,
			bloomStrength: 0.95
		})
	}
];

/** Atlantis awake: its own light fills the abyss. Blended in by the story. */
export const ILLUMINATED_STATE: IEnvironmentState = state({
	water: '#05222f',
	downwell: '#4fb3ad',
	fogDensity: 0.024,
	sunIntensity: 0.12,
	ambientIntensity: 0.5,
	caustics: 0.15,
	godRays: 0,
	particles: 0.7,
	exposure: 1.15,
	bloomStrength: 0.75
});

/** How much sun and caustics survive inside the wreck or temple (0 = none). */
export const SHELTER_LIGHT = 0.25;
