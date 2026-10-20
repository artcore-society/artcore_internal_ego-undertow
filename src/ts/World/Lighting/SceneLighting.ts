import { Color, DirectionalLight, Group, HemisphereLight, type Vector3 } from 'three';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

/** Downwelling light: a hemisphere for the ambient blue, a sun from above. No shadow maps: caustics sell it instead. */
export default class SceneLighting extends Group implements IEnvironmentAware {
	private readonly _hemisphere = new HemisphereLight('#c9f4ff', '#0a1c26', 1);
	private readonly _sun = new DirectionalLight('#fff4dc', 1);
	private readonly _sunlight = new Color('#fff4dc');
	private _flash = 0;
	private _ambient = 1;

	constructor() {
		super();

		this._sun.position.set(18, 60, 10);
		this.add(this._hemisphere, this._sun, this._sun.target);
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._hemisphere.color.copy(state.downwellColor);
		this._hemisphere.groundColor.copy(state.waterColor).multiplyScalar(0.35);
		this._ambient = state.ambientIntensity;
		this._hemisphere.intensity = this._ambient + this._flash * 1.1;
		this._sun.intensity = state.sunIntensity;
		this._sun.color.copy(state.downwellColor).lerp(this._sunlight, 0.5);
	}

	/** 0..1 lightning: floods the water with cold light for an instant. */
	public set flash(value: number) {
		this._flash = value;
		this._hemisphere.intensity = this._ambient + value * 1.1;
	}

	/** Keeps the directional light's frame around the diver (it only matters for direction, no shadows). */
	public follow(target: Vector3): void {
		this._sun.position.set(target.x + 18, target.y + 60, target.z + 10);
		this._sun.target.position.copy(target);
	}
}
