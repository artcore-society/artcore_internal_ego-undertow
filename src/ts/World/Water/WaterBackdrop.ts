import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3, type Camera } from 'three';
import vertexShader from '../../../shaders/water/backdrop.vertex.glsl';
import fragmentShader from '../../../shaders/water/backdrop.fragment.glsl';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

interface IBackdropUniformValues {
	uWaterColor: Color;
	uDownwellColor: Color;
	uSunDirection: Vector3;
	uSunGlow: number;
	uFlash: number;
}

/** The water all around: a camera-centred sphere with the fog's gradient and the sun's glow from above. */
export default class WaterBackdrop
	extends Mesh<SphereGeometry, ShaderMaterial>
	implements IEnvironmentAware, IDisposable
{
	private readonly _uniforms: TypedUniforms<IBackdropUniformValues>;

	constructor() {
		const uniforms: TypedUniforms<IBackdropUniformValues> = {
			uWaterColor: { value: new Color() },
			uDownwellColor: { value: new Color() },
			uSunDirection: { value: new Vector3(0.25, 1, -0.35).normalize() },
			uSunGlow: { value: 1 },
			uFlash: { value: 0 }
		};

		super(
			new SphereGeometry(10, 32, 16),
			new ShaderMaterial({
				uniforms,
				vertexShader,
				fragmentShader,
				side: BackSide,
				depthWrite: false,
				depthTest: false
			})
		);

		this._uniforms = uniforms;
		this.frustumCulled = false;
		this.renderOrder = -10;
	}

	/** 0..1 lightning brightness. */
	public set flash(value: number) {
		this._uniforms.uFlash.value = value;
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._uniforms.uWaterColor.value.copy(state.waterColor);
		this._uniforms.uDownwellColor.value.copy(state.downwellColor);
		this._uniforms.uSunGlow.value = state.godRays * 0.9;
	}

	public follow(camera: Camera): void {
		this.position.copy(camera.position);
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
