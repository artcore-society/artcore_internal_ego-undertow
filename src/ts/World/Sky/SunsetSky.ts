import { BackSide, Mesh, ShaderMaterial, SphereGeometry, type Camera } from 'three';
import vertexShader from '../../../shaders/sky/sky.vertex.glsl';
import fragmentShader from '../../../shaders/sky/sky.fragment.glsl';
import { SUNSET_SUN } from '../../Config/world.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/** The sky above the sea once the storm has passed: a camera-centred dome at sunset, behind everything. */
export default class SunsetSky extends Mesh<SphereGeometry, ShaderMaterial> implements IDisposable {
	constructor(water: WaterUniforms) {
		super(
			new SphereGeometry(10, 48, 24),
			new ShaderMaterial({
				uniforms: { uTime: water.time, uSunDirection: { value: SUNSET_SUN } },
				vertexShader,
				fragmentShader,
				side: BackSide,
				depthWrite: false,
				depthTest: false
			})
		);

		this.frustumCulled = false;
		this.renderOrder = -10;
		this.visible = false;
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
