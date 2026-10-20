import { Color, Vector2, type Texture } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import vertexShader from '../../shaders/post/underwater.vertex.glsl';
import fragmentShader from '../../shaders/post/underwater.fragment.glsl';
import type { TypedUniforms } from '../Helpers/uniforms.ts';

interface IUnderwaterUniformValues {
	tDiffuse: Texture | null;
	uTime: number;
	uResolution: Vector2;
	uDistortion: number;
	uSpeed: number;
	uHypoxia: number;
	uFade: number;
	uTint: Color;
	uLamp: number;
	uAir: number;
	uWet: number;
	uSheet: number;
}

/** Refraction wobble, chromatic fringe, tinted mask vignette, hypoxia and blackout fade, grain: one pass. */
export default class UnderwaterPass extends ShaderPass {
	private readonly _uniforms: TypedUniforms<IUnderwaterUniformValues>;

	constructor() {
		super({
			uniforms: {
				tDiffuse: { value: null },
				uTime: { value: 0 },
				uResolution: { value: new Vector2(1, 1) },
				uDistortion: { value: 0.0018 },
				uSpeed: { value: 0 },
				uHypoxia: { value: 0 },
				uFade: { value: 0 },
				uTint: { value: new Color() },
				uLamp: { value: 0 },
				uAir: { value: 0 },
				uWet: { value: 0 },
				uSheet: { value: 1 }
			},
			vertexShader,
			fragmentShader
		});

		// ShaderPass clones the uniforms it is given; keep a typed view on the live copy
		this._uniforms = this.uniforms as TypedUniforms<IUnderwaterUniformValues>;
	}

	public set time(value: number) {
		this._uniforms.uTime.value = value;
	}

	public set speed(value: number) {
		this._uniforms.uSpeed.value = value;
	}

	public set hypoxia(value: number) {
		this._uniforms.uHypoxia.value = value;
	}

	public set lamp(value: number) {
		this._uniforms.uLamp.value = value;
	}

	/** 0..1 how far out of the water the view is: no wobble, no murky vignette. */
	public set air(value: number) {
		this._uniforms.uAir.value = value;
	}

	/** 0..1 water still running down the mask after breaking the surface. */
	public set wet(value: number) {
		this._uniforms.uWet.value = value;
	}

	/** 0..1 how far the sheet of water has drained off the mask after breaking the surface. */
	public set sheet(value: number) {
		this._uniforms.uSheet.value = value;
	}

	public set fade(value: number) {
		this._uniforms.uFade.value = value;
	}

	public get tint(): Color {
		return this._uniforms.uTint.value;
	}

	public setResolution(width: number, height: number): void {
		this._uniforms.uResolution.value.set(width, height);
	}
}
