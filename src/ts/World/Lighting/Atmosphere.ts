import { Color, FogExp2, type Scene } from 'three';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

/** Water as fog: exponential falloff into the water colour, which also fills the background. */
export default class Atmosphere implements IEnvironmentAware {
	public readonly fog = new FogExp2('#1b7f9a', 0.02);
	public readonly background = new Color('#1b7f9a');

	public attach(scene: Scene): void {
		scene.fog = this.fog;
		scene.background = this.background;
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this.fog.color.copy(state.waterColor);
		this.fog.density = state.fogDensity;
		this.background.copy(state.waterColor);
	}
}
