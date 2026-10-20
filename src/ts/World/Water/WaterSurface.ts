import { BackSide, Color, Mesh, PlaneGeometry, ShaderMaterial, type Camera } from 'three';
import vertexShader from '../../../shaders/water/surface.vertex.glsl';
import fragmentShader from '../../../shaders/water/surface.fragment.glsl';
import { SURFACE_Y } from '../../Config/world.ts';
import type WaterUniforms from './WaterUniforms.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

interface ISurfaceUniformValues {
	uTime: number;
	uWaterColor: Color;
	uSkyColor: Color;
	uFogDensity: number;
	uBrightness: number;
}

/** The underside of the sea: Snell's window overhead, a dark mirror towards the horizon. */
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
			uSkyColor: { value: new Color('#dff9ff') },
			uFogDensity: { value: 0.02 },
			uBrightness: { value: 1 }
		};

		super(
			new PlaneGeometry(700, 700, 1, 1).rotateX(-Math.PI / 2),
			new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: BackSide, depthWrite: false })
		);

		this._uniforms = uniforms;
		this.position.y = SURFACE_Y;
		this.frustumCulled = false;
		this.renderOrder = -1;
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._uniforms.uWaterColor.value.copy(state.waterColor);
		this._uniforms.uFogDensity.value = state.fogDensity;
		this._uniforms.uBrightness.value = 0.4 + state.sunIntensity * 0.35;
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
