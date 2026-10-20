import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, type Camera } from 'three';
import vertexShader from '../../../shaders/sky/sea.vertex.glsl';
import fragmentShader from '../../../shaders/sky/sea.fragment.glsl';
import { SUNSET_SUN, SURFACE_Y } from '../../Config/world.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * The sea seen from above: a calm evening swell mirroring the sunset, the sun's road glittering on
 * it, fading into the haze at the horizon. Opaque, so the whole world below is hidden under it.
 */
export default class OpenSea extends Mesh<BufferGeometry, ShaderMaterial> implements IDisposable {
	/** Metres from the camera to the edge of the sea; the haze has swallowed it well before. */
	public static readonly REACH = 2400;
	private static readonly SEGMENTS = 160;
	private static readonly NEAREST_RING = 0.4;
	/** Each ring this much wider than the last: dense under the camera, sparse towards the horizon. */
	private static readonly RING_GROWTH = 1.035;

	private readonly _time: { value: number };

	constructor(water: WaterUniforms) {
		super(
			OpenSea.createGeometry(),
			new ShaderMaterial({
				uniforms: { uTime: water.time, uSunDirection: { value: SUNSET_SUN } },
				vertexShader,
				fragmentShader
			})
		);

		this._time = water.time;
		this.position.y = SURFACE_Y;
		this.frustumCulled = false;
		this.visible = false;
	}

	/** Height of the swell at a point, as the sea shader lifts it (without its faint noise). */
	public heightAt(x: number, z: number): number {
		const time = this._time.value;

		return (
			SURFACE_Y +
			Math.sin(x * 0.08 - z * 0.18 + time * 0.9) * 0.45 +
			Math.sin(-x * 0.12 - z * 0.26 + time * 1.25 + 1.7) * 0.25 +
			Math.sin(x * 0.3 - z * 0.35 + time * 1.7 + 4.1) * 0.1
		);
	}

	public follow(camera: Camera): void {
		this.position.x = camera.position.x;
		this.position.z = camera.position.z;
	}

	/** Rings around the camera, spaced wider and wider: fine detail where the waves are seen up close. */
	private static createGeometry(): BufferGeometry {
		const radii = [0];

		for (let radius = OpenSea.NEAREST_RING; radius < OpenSea.REACH; radius *= OpenSea.RING_GROWTH) {
			radii.push(radius);
		}

		radii.push(OpenSea.REACH);

		const segments = OpenSea.SEGMENTS;
		const positions = new Float32Array(radii.length * segments * 3);
		const indices: number[] = [];

		radii.forEach((radius, ring) => {
			for (let segment = 0; segment < segments; segment++) {
				const angle = (segment / segments) * Math.PI * 2;
				positions.set([Math.cos(angle) * radius, 0, Math.sin(angle) * radius], (ring * segments + segment) * 3);

				if (ring > 0) {
					const a = (ring - 1) * segments + segment;
					const b = (ring - 1) * segments + ((segment + 1) % segments);
					const c = ring * segments + segment;
					const d = ring * segments + ((segment + 1) % segments);
					// Counter-clockwise seen from above, so the sea faces up
					indices.push(a, b, c, b, d, c);
				}
			}
		});

		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new BufferAttribute(positions, 3));
		geometry.setIndex(indices);

		return geometry;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
