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

/** Light dies with depth: sunlit turquoise → blue twilight → black. Sorted by depth. */
export const DEPTH_STOPS: readonly IDepthStop[] = [
	{
		depth: 0,
		state: state({
			water: '#3aa9bf',
			downwell: '#c9f4ff',
			fogDensity: 0.016,
			sunIntensity: 2.6,
			ambientIntensity: 1.5,
			caustics: 1,
			godRays: 1,
			particles: 0.5,
			exposure: 1,
			bloomStrength: 0.35
		})
	},
	{
		depth: 28,
		state: state({
			water: '#1b7f9a',
			downwell: '#9fe2f2',
			fogDensity: 0.019,
			sunIntensity: 1.7,
			ambientIntensity: 1.1,
			caustics: 0.7,
			godRays: 0.75,
			particles: 0.6,
			exposure: 1.05,
			bloomStrength: 0.4
		})
	},
	{
		depth: 52,
		state: state({
			water: '#0e4e6e',
			downwell: '#5fb4d6',
			fogDensity: 0.023,
			sunIntensity: 0.85,
			ambientIntensity: 0.7,
			caustics: 0.32,
			godRays: 0.4,
			particles: 0.7,
			exposure: 1.15,
			bloomStrength: 0.5
		})
	},
	{
		depth: 100,
		state: state({
			water: '#062841',
			downwell: '#3f86ad',
			fogDensity: 0.026,
			sunIntensity: 0.3,
			ambientIntensity: 0.75,
			caustics: 0.05,
			godRays: 0.12,
			particles: 0.8,
			exposure: 1.3,
			bloomStrength: 0.7
		})
	},
	{
		depth: 165,
		state: state({
			water: '#031426',
			downwell: '#3f86ad',
			fogDensity: 0.026,
			sunIntensity: 0.1,
			ambientIntensity: 0.95,
			caustics: 0,
			godRays: 0,
			particles: 0.9,
			exposure: 1.45,
			bloomStrength: 0.9
		})
	}
];

/** Atlantis awake: its own light fills the abyss. Blended in by the story. */
export const ILLUMINATED_STATE: IEnvironmentState = state({
	water: '#0a3550',
	downwell: '#7fe9e2',
	fogDensity: 0.017,
	sunIntensity: 0.2,
	ambientIntensity: 0.75,
	caustics: 0.25,
	godRays: 0,
	particles: 1,
	exposure: 1.3,
	bloomStrength: 1.05
});

/** How much sun and caustics survive inside the wreck or temple (0 = none). */
export const SHELTER_LIGHT = 0.25;
