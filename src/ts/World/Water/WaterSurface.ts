import { BackSide, Color, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3, type Camera } from 'three';
import vertexShader from '../../../shaders/water/surface.vertex.glsl';
import fragmentShader from '../../../shaders/water/surface.fragment.glsl';
import { SURFACE_Y } from '../../Config/world.ts';
import type WaterUniforms from './WaterUniforms.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';
import type { IStrike } from '../../Environment/Storm.ts';

interface ISurfaceUniformValues {
	uTime: number;
	uWaterColor: Color;
	uDownwellColor: Color;
	uSunDirection: Vector3;
	uFogDensity: number;
	uBrightness: number;
	uFlash: number;
	uCalm: number;
	uBoltDirection: Vector2;
	uBoltSeed: number;
	uImpact: Vector2;
	uImpactAge: number;
}

/** The underside of the sea: refracting waves, Snell's window and the sun overhead, a rippling mirror beyond. */
export default class WaterSurface
	extends Mesh<PlaneGeometry, ShaderMaterial>
	implements IEnvironmentAware, IDisposable
{
	/** Beyond this depth the surface is lost in the dark and not drawn at all. */
	private static readonly VISIBLE_DEPTH = 90;

	private readonly _uniforms: TypedUniforms<ISurfaceUniformValues>;

	constructor(water: WaterUniforms) {
		const uniforms: TypedUniforms<ISurfaceUniformValues> = {
			uTime: water.time,
			uWaterColor: { value: new Color() },
			uDownwellColor: { value: new Color() },
			uSunDirection: { value: new Vector3(0.25, 1, -0.35).normalize() },
			uFogDensity: { value: 0.02 },
			uBrightness: { value: 1 },
			uFlash: { value: 0 },
			uCalm: { value: 0 },
			uBoltDirection: { value: new Vector2(0, 1) },
			uBoltSeed: { value: 0 },
			uImpact: { value: new Vector2(0, 100000) },
			uImpactAge: { value: 100 }
		};

		super(
			new PlaneGeometry(900, 900, 1, 1).rotateX(-Math.PI / 2),
			new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: BackSide, depthWrite: false })
		);

		this._uniforms = uniforms;
		this.position.y = SURFACE_Y;
		this.frustumCulled = false;
		this.renderOrder = -1;
	}

	/** 0..1 lightning brightness. */
	public set flash(value: number) {
		this._uniforms.uFlash.value = value;
	}

	/** Draws a strike: its bolt in the sky window and, when close, its impact on the surface. */
	public strike(strike: Readonly<IStrike>, observer: Vector3): void {
		const x = Math.sin(strike.azimuth);
		const z = Math.cos(strike.azimuth);

		this._uniforms.uBoltDirection.value.set(x, z);
		this._uniforms.uBoltSeed.value = strike.seed;
		this._uniforms.uImpact.value.set(observer.x + x * strike.distance, observer.z + z * strike.distance);
		this._uniforms.uImpactAge.value = 0;
	}

	/** 0..1 how far the storm has passed (1: a calm sea at sunset). */
	public set calm(value: number) {
		this._uniforms.uCalm.value = value;
	}

	/** Ages the ripple of the last impact. */
	public update(delta: number): void {
		this._uniforms.uImpactAge.value += delta;
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._uniforms.uWaterColor.value.copy(state.waterColor);
		this._uniforms.uDownwellColor.value.copy(state.downwellColor);
		this._uniforms.uFogDensity.value = state.fogDensity;
		this._uniforms.uBrightness.value = 0.35 + state.sunIntensity * 0.3;
	}

	public follow(camera: Camera): void {
		this.position.x = camera.position.x;
		this.position.z = camera.position.z;
		this.visible = SURFACE_Y - camera.position.y < WaterSurface.VISIBLE_DEPTH;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
