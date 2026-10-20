import { AdditiveBlending, Color, ConeGeometry, Group, Mesh, Object3D, ShaderMaterial, SpotLight } from 'three';
import vertexShader from '../../../shaders/effects/beam.vertex.glsl';
import fragmentShader from '../../../shaders/effects/beam.fragment.glsl';
import { damp } from '../../Helpers/math.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

interface IBeamUniformValues {
	uColor: Color;
	uIntensity: number;
}

/**
 * Head lamp: one spot light plus a fake volumetric cone. The light stays in the scene when off
 * (intensity 0) so toggling never changes the light count and never recompiles a shader.
 */
export default class Flashlight extends Group implements IDisposable {
	private static readonly RANGE = 34;
	private static readonly POWER = 90;

	public isOn = false;

	private readonly _light = new SpotLight('#e9fbff', 0, Flashlight.RANGE, 0.42, 0.55, 1.1);
	private readonly _target = new Object3D();
	private readonly _beam: Mesh<ConeGeometry, ShaderMaterial>;
	private readonly _uniforms: TypedUniforms<IBeamUniformValues>;
	private _level = 0;

	constructor() {
		super();

		const length = 14;
		this._uniforms = { uColor: { value: new Color('#bdf3ff') }, uIntensity: { value: 0 } };
		this._beam = new Mesh(
			new ConeGeometry(Math.tan(0.42) * length, length, 24, 1, true).translate(0, -length / 2, 0).rotateX(Math.PI / 2),
			new ShaderMaterial({
				uniforms: this._uniforms,
				vertexShader,
				fragmentShader,
				defines: { LENGTH: length.toFixed(1) },
				transparent: true,
				depthWrite: false,
				blending: AdditiveBlending
			})
		);
		this._beam.visible = false;

		// ConeGeometry points up; after the rotation its apex is at the origin and it opens towards -Z
		this._target.position.set(0, -0.2, -10);
		this._light.target = this._target;
		this.add(this._light, this._target, this._beam);
	}

	public get level(): number {
		return this._level;
	}

	public toggle(): boolean {
		this.isOn = !this.isOn;

		return this.isOn;
	}

	/** @param darkness 0..1 how dark the water is: the beam only reads once the light is gone */
	public update(darkness: number, delta: number): void {
		this._level = damp(this._level, this.isOn ? 1 : 0, 8, delta);
		this._light.intensity = this._level * Flashlight.POWER;
		this._uniforms.uIntensity.value = this._level * (0.25 + darkness * 0.75);
		this._beam.visible = this._level > 0.01;
	}

	public override dispose(): void {
		this._light.dispose();
		this._beam.geometry.dispose();
		this._beam.material.dispose();
		super.dispose();
	}
}
