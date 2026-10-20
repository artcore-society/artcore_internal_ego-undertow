import {
	Box3,
	Color,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	Mesh,
	MeshStandardMaterial,
	Sphere,
	Vector3
} from 'three';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type { IModelPart } from '../../Assets/AssetLibrary.ts';

export interface IFishSchoolOptions {
	readonly count: number;
	/** Average orbit radius around the school centre. */
	readonly radius: number;
	/** Vertical spread. */
	readonly height: number;
	/** Average angular speed in radians per second. */
	readonly speed: number;
	/** Body length in metres. */
	readonly length: number;
	/** Tints multiplied over the fish texture; white keeps it as scanned. */
	readonly colors: readonly string[];
	readonly seed: number;
	/** Bioluminescence: the fish emit this colour (bright enough to bloom). */
	readonly glow?: string;
}

/**
 * A school of fish in one draw call: one textured fish model, instanced, each swimming its own orbit
 * in the vertex shader. Build the template once with `FishSchool.template()` and share it.
 */
export default class FishSchool extends Mesh<InstancedBufferGeometry, MeshStandardMaterial> implements IDisposable {
	/**
	 * Normalises a fish model for the swim shader: centred, 1 unit long, head towards -Z, tail at +Z.
	 * @param headTowardsPositiveZ how the source model is oriented
	 */
	public static template(part: IModelPart, headTowardsPositiveZ: boolean): IModelPart {
		const geometry = part.geometry.clone();
		geometry.computeBoundingBox();
		const box = geometry.boundingBox ?? new Box3();
		const centre = box.getCenter(new Vector3());
		const size = box.getSize(new Vector3());

		geometry.translate(-centre.x, -centre.y, -centre.z);
		geometry.scale(1 / size.z, 1 / size.z, 1 / size.z);

		if (headTowardsPositiveZ) {
			geometry.rotateY(Math.PI);
		}

		return { geometry, material: part.material };
	}

	constructor(water: WaterUniforms, patches: LifePatches, template: IModelPart, options: IFishSchoolOptions) {
		const geometry = new InstancedBufferGeometry().copy(template.geometry as InstancedBufferGeometry);
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
			scales[i] = options.length * random.range(0.8, 1.2);
			color.set(options.colors[i % options.colors.length] ?? '#ffffff').offsetHSL(0, 0, random.range(-0.04, 0.04));
			color.toArray(colors, i * 3);
		}

		geometry.setAttribute('aOrbit', new InstancedBufferAttribute(orbits, 4));
		geometry.setAttribute('aScale', new InstancedBufferAttribute(scales, 1));
		geometry.setAttribute('color', new InstancedBufferAttribute(colors, 3));
		geometry.instanceCount = options.count;
		// Culling must cover the whole orbit, not the single fish template
		geometry.boundingSphere = new Sphere(new Vector3(), options.radius * 1.4 + options.height + 2);

		const material = (template.material as MeshStandardMaterial).clone();
		material.vertexColors = true;

		if (options.glow) {
			material.emissive = new Color(options.glow);
			material.emissiveIntensity = 2.5;
		}

		super(geometry, patchMaterial(material, patches.fish, water.caustics));
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
