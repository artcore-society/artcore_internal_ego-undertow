import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Points, ShaderMaterial } from 'three';
import vertexShader from '../../../shaders/water/snow.vertex.glsl';
import fragmentShader from '../../../shaders/water/snow.fragment.glsl';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import type WaterUniforms from './WaterUniforms.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

interface ISnowUniformValues {
	uTime: number;
	uBox: number;
	uSize: number;
	uPixelRatio: number;
	uColor: Color;
	uOpacity: number;
}

/** Drifting particles that sell the volume of water. Positions wrap around the camera on the GPU: no CPU cost. */
export default class MarineSnow
	extends Points<BufferGeometry, ShaderMaterial>
	implements IEnvironmentAware, IDisposable
{
	private static readonly COUNT = 2600;

	private readonly _uniforms: TypedUniforms<ISnowUniformValues>;

	constructor(water: WaterUniforms) {
		const random = new SeededRandom(3);
		const seeds = new Float32Array(MarineSnow.COUNT * 4);

		for (let i = 0; i < seeds.length; i++) {
			seeds[i] = random.next();
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 4));
		// Points need a position attribute for the draw count; the shader ignores it
		geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(MarineSnow.COUNT * 3), 3));

		const uniforms: TypedUniforms<ISnowUniformValues> = {
			uTime: water.time,
			uBox: { value: 44 },
			uSize: { value: 42 },
			uPixelRatio: { value: 1 },
			uColor: { value: new Color() },
			uOpacity: { value: 0.5 }
		};

		super(
			geometry,
			new ShaderMaterial({
				uniforms,
				vertexShader,
				fragmentShader,
				transparent: true,
				depthWrite: false,
				blending: AdditiveBlending
			})
		);

		this._uniforms = uniforms;
		this.frustumCulled = false;
	}

	public set pixelRatio(value: number) {
		this._uniforms.uPixelRatio.value = value;
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._uniforms.uColor.value.copy(state.downwellColor).lerp(state.waterColor, 0.35);
		this._uniforms.uOpacity.value = state.particles * 0.45;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
