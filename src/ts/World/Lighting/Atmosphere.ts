import { FogExp2, type Scene, type Texture } from 'three';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

/**
 * Water as fog (see Helpers/underwaterFog.ts for the shading), plus the strength of the image-based
 * light, which fades with depth like everything else.
 */
export default class Atmosphere implements IEnvironmentAware {
	public readonly fog = new FogExp2('#1b7f9a', 0.02);

	private _scene: Scene | null = null;

	public attach(scene: Scene, environment: Texture): void {
		this._scene = scene;
		scene.fog = this.fog;
		scene.environment = environment;
		// The backdrop draws the water; no clear colour needed
		scene.background = null;
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this.fog.color.copy(state.waterColor);
		this.fog.density = state.fogDensity;

		if (this._scene) {
			this._scene.environmentIntensity = state.ambientIntensity * 0.55;
		}
	}
}
