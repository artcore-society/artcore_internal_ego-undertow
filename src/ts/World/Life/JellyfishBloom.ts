import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	DoubleSide,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	LatheGeometry,
	Mesh,
	PlaneGeometry,
	ShaderMaterial,
	Sphere,
	Vector2,
	Vector3
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import vertexShader from '../../../shaders/life/jelly.vertex.glsl';
import fragmentShader from '../../../shaders/life/jelly.fragment.glsl';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

interface IJellyUniformValues {
	uTime: number;
	uColor: Color;
	uGlow: Color;
	uFogDensity: number;
}

/**
 * A bloom of jellyfish in one draw call: translucent bells that glow at the rim, frilled oral arms and
 * long trailing tentacles, all pulsing and drifting in the vertex shader.
 */
export default class JellyfishBloom extends Mesh<InstancedBufferGeometry, ShaderMaterial> implements IDisposable {
	private static readonly TENTACLES = 16;
	private static readonly ARMS = 4;

	constructor(water: WaterUniforms, positions: readonly Vector3[], tint: string, seed: number) {
		const template = JellyfishBloom.createGeometry(seed);
		const geometry = new InstancedBufferGeometry().copy(template as InstancedBufferGeometry);
		template.dispose();

		const random = new SeededRandom(seed + 7);
		const jellies = new Float32Array(positions.length * 4);
		positions.forEach((position, index) =>
			jellies.set([position.x, position.y, position.z, random.range(0.6, 1.4)], index * 4)
		);
		geometry.setAttribute('aJelly', new InstancedBufferAttribute(jellies, 4));
		geometry.instanceCount = positions.length;

		const centre = positions
			.reduce((sum, position) => sum.add(position), new Vector3())
			.divideScalar(Math.max(1, positions.length));
		const radius = positions.reduce((max, position) => Math.max(max, position.distanceTo(centre)), 0);
		geometry.boundingSphere = new Sphere(centre, radius + 8);

		const color = new Color(tint);
		const uniforms: TypedUniforms<IJellyUniformValues> = {
			uTime: water.time,
			uColor: { value: color.clone().multiplyScalar(1.2) },
			uGlow: { value: color.clone().lerp(new Color('#ffffff'), 0.4).multiplyScalar(1.6) },
			uFogDensity: water.fogDensity
		};

		super(
			geometry,
			new ShaderMaterial({
				uniforms,
				vertexShader,
				fragmentShader,
				transparent: true,
				depthWrite: false,
				side: DoubleSide,
				blending: AdditiveBlending
			})
		);
	}

	/** One jellyfish: bell (part 0), oral arms (1), tentacles (2), with how far along each vertex is. */
	private static createGeometry(seed: number): BufferGeometry {
		const random = new SeededRandom(seed);
		const parts: BufferGeometry[] = [];

		// Bell: a dome whose rim is scalloped
		const profile: Vector2[] = [];

		for (let i = 0; i <= 16; i++) {
			const t = i / 16;
			profile.push(
				new Vector2(Math.sin(t * Math.PI * 0.5) * 0.6, Math.cos(t * Math.PI * 0.5) * 0.45 - 0.1 - t * t * 0.05)
			);
		}

		const bell = new LatheGeometry(profile, 40).toNonIndexed();
		const bellPosition = bell.getAttribute('position');

		for (let i = 0; i < bellPosition.count; i++) {
			const x = bellPosition.getX(i);
			const z = bellPosition.getZ(i);
			const rim = Math.max(0, -bellPosition.getY(i) + 0.05) * 3;
			const scallop = 1 + Math.sin(Math.atan2(z, x) * 16) * 0.04 * rim;
			bellPosition.setXYZ(i, x * scallop, bellPosition.getY(i), z * scallop);
		}

		bell.computeVertexNormals();
		parts.push(JellyfishBloom.tag(bell, 0, () => 0));

		// Oral arms: frilled ribbons hanging from the centre
		for (let arm = 0; arm < JellyfishBloom.ARMS; arm++) {
			const length = random.range(1, 1.5);
			const ribbon = new PlaneGeometry(0.16, length, 1, 12).translate(0, -length / 2 - 0.1, 0);
			const position = ribbon.getAttribute('position');

			for (let i = 0; i < position.count; i++) {
				position.setX(i, position.getX(i) * (1 + Math.sin(position.getY(i) * 22) * 0.35));
			}

			ribbon.rotateY((arm / JellyfishBloom.ARMS) * Math.PI * 2 + 0.3);
			ribbon.translate(Math.cos(arm * 1.57) * 0.06, 0, Math.sin(arm * 1.57) * 0.06);
			parts.push(JellyfishBloom.tag(ribbon.toNonIndexed(), 1, (y) => Math.min(1, -y / (length + 0.1))));
		}

		// Tentacles: long thin ribbons from the rim
		for (let tentacle = 0; tentacle < JellyfishBloom.TENTACLES; tentacle++) {
			const angle = (tentacle / JellyfishBloom.TENTACLES) * Math.PI * 2;
			const length = random.range(2.2, 4);
			const strand = new PlaneGeometry(0.025, length, 1, 24).translate(0, -length / 2, 0);

			strand.rotateY(angle + Math.PI / 2);
			strand.translate(Math.cos(angle) * 0.52, -0.12, Math.sin(angle) * 0.52);
			parts.push(JellyfishBloom.tag(strand.toNonIndexed(), 2, (y) => Math.min(1, (-y - 0.12) / length)));
		}

		const merged = mergeGeometries(parts) ?? bell;
		parts.forEach((part) => part !== merged && part.dispose());

		return merged;
	}

	/** Adds aPart and aAlong attributes to a piece of the jellyfish. */
	private static tag(geometry: BufferGeometry, part: number, along: (y: number) => number): BufferGeometry {
		const position = geometry.getAttribute('position');
		const parts = new Float32Array(position.count).fill(part);
		const alongs = new Float32Array(position.count);

		for (let i = 0; i < position.count; i++) {
			alongs[i] = Math.max(0, along(position.getY(i)));
		}

		geometry.setAttribute('aPart', new BufferAttribute(parts, 1));
		geometry.setAttribute('aAlong', new BufferAttribute(alongs, 1));

		return geometry;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
