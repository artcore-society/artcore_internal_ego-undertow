import {
	BackSide,
	Color,
	Mesh,
	PMREMGenerator,
	Scene,
	ShaderMaterial,
	SphereGeometry,
	type Texture,
	type WebGLRenderer
} from 'three';
import vertexShader from '../../../shaders/lighting/probe.vertex.glsl';
import fragmentShader from '../../../shaders/lighting/probe.fragment.glsl';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * Image-based lighting for the PBR assets: a pre-filtered environment of bright water above and dark
 * water below, generated once (no HDRI download). Its strength follows depth via scene.environmentIntensity.
 */
export default class LightProbe implements IDisposable {
	public readonly texture: Texture;

	private readonly _generator: PMREMGenerator;

	constructor(renderer: WebGLRenderer) {
		this._generator = new PMREMGenerator(renderer);

		const scene = new Scene();
		const geometry = new SphereGeometry(1, 32, 16);
		const material = new ShaderMaterial({
			side: BackSide,
			uniforms: {
				uTop: { value: new Color('#f2fdff') },
				uMiddle: { value: new Color('#3c9dbb') },
				uBottom: { value: new Color('#0a2534') }
			},
			vertexShader,
			fragmentShader
		});
		scene.add(new Mesh(geometry, material));

		this.texture = this._generator.fromScene(scene, 0, 0.1, 10, { size: 128 }).texture;

		geometry.dispose();
		material.dispose();
	}

	public dispose(): void {
		this.texture.dispose();
		this._generator.dispose();
	}
}
