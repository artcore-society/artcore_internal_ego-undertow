import {
	AdditiveBlending,
	Color,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	Mesh,
	PlaneGeometry,
	ShaderMaterial,
	Vector3
} from 'three';
import vertexShader from '../../../shaders/water/rays.vertex.glsl';
import fragmentShader from '../../../shaders/water/rays.fragment.glsl';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import { SURFACE_Y } from '../../Config/world.ts';
import type WaterUniforms from './WaterUniforms.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

interface IShaftUniformValues {
	uTime: number;
	uSurfaceY: number;
	uCell: number;
	uSlant: Vector3;
	uIntensity: number;
	uColor: Color;
}

/** God rays: additive billboards hanging from the surface, wrapped around the camera on the GPU. */
export default class LightShafts
	extends Mesh<InstancedBufferGeometry, ShaderMaterial>
	implements IEnvironmentAware, IDisposable
{
	private static readonly COUNT = 26;

	private readonly _uniforms: TypedUniforms<IShaftUniformValues>;

	constructor(water: WaterUniforms) {
		const geometry = new InstancedBufferGeometry().copy(
			new PlaneGeometry(1, 1, 1, 6) as unknown as InstancedBufferGeometry
		);
		const random = new SeededRandom(7);
		const rays = new Float32Array(LightShafts.COUNT * 4);

		for (let i = 0; i < LightShafts.COUNT; i++) {
			rays.set([random.next(), random.next(), random.range(2.5, 7), random.next()], i * 4);
		}

		geometry.setAttribute('aRay', new InstancedBufferAttribute(rays, 4));
		geometry.instanceCount = LightShafts.COUNT;

		const uniforms: TypedUniforms<IShaftUniformValues> = {
			uTime: water.time,
			uSurfaceY: { value: SURFACE_Y },
			uCell: { value: 90 },
			uSlant: { value: new Vector3(0.18, -1, -0.12) },
			uIntensity: { value: 1 },
			uColor: { value: new Color() }
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

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._uniforms.uIntensity.value = state.godRays;
		this._uniforms.uColor.value.copy(state.downwellColor);
		this.visible = state.godRays > 0.01;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
