import {
	BufferGeometry,
	Color,
	ConeGeometry,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	Mesh,
	MeshLambertMaterial,
	SphereGeometry,
	Sphere,
	Vector3
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

export interface IFishSchoolOptions {
	readonly count: number;
	/** Average orbit radius around the school centre. */
	readonly radius: number;
	/** Vertical spread. */
	readonly height: number;
	/** Average angular speed in radians per second. */
	readonly speed: number;
	readonly scale: number;
	readonly colors: readonly string[];
	readonly seed: number;
}

/** A school of fish in one draw call: every fish swims its own orbit in the vertex shader. */
export default class FishSchool extends Mesh<InstancedBufferGeometry, MeshLambertMaterial> implements IDisposable {
	/** Low-poly fish facing -Z, tail at +Z. */
	public static createGeometry(): BufferGeometry {
		const body = new SphereGeometry(0.5, 8, 6).scale(0.22, 0.42, 1);
		const tail = new ConeGeometry(0.28, 0.4, 4)
			.rotateX(-Math.PI / 2)
			.scale(0.12, 1, 1)
			.translate(0, 0, 0.62);

		return mergeGeometries([body.toNonIndexed(), tail.toNonIndexed()]) ?? body;
	}

	constructor(water: WaterUniforms, patches: LifePatches, fishGeometry: BufferGeometry, options: IFishSchoolOptions) {
		const geometry = new InstancedBufferGeometry().copy(fishGeometry as InstancedBufferGeometry);
		const random = new SeededRandom(options.seed);
		const orbits = new Float32Array(options.count * 4);
		const scales = new Float32Array(options.count);
		const colors = new Float32Array(options.count * 3);
		const color = new Color();
		const direction = random.next() > 0.5 ? 1 : -1;

		for (let i = 0; i < options.count; i++) {
			orbits.set(
				[
					options.radius * random.range(0.55, 1.2),
					random.range(-options.height, options.height) * 0.5,
					direction * options.speed * random.range(0.85, 1.15),
					random.range(0, Math.PI * 2)
				],
				i * 4
			);
			scales[i] = options.scale * random.range(0.75, 1.25);
			color.set(options.colors[i % options.colors.length] ?? '#ffffff').offsetHSL(0, 0, random.range(-0.05, 0.05));
			color.toArray(colors, i * 3);
		}

		geometry.setAttribute('aOrbit', new InstancedBufferAttribute(orbits, 4));
		geometry.setAttribute('aScale', new InstancedBufferAttribute(scales, 1));
		geometry.setAttribute('color', new InstancedBufferAttribute(colors, 3));
		geometry.instanceCount = options.count;
		// Culling must cover the whole orbit, not the single fish template
		geometry.boundingSphere = new Sphere(new Vector3(), options.radius * 1.4 + options.height + 2);

		super(geometry, patchMaterial(new MeshLambertMaterial({ vertexColors: true }), patches.fish, water.caustics));
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
