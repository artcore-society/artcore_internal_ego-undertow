import {
	Box3,
	Color,
	Euler,
	Group,
	InstancedMesh,
	Matrix4,
	MeshStandardMaterial,
	Object3D,
	Quaternion,
	Vector3
} from 'three';
import { canyonCentre, canyonWidthAt, floorAt, type ISceneConfig } from '../../Config/world.ts';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import { patchMaterial, type IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import FishSchool, { type IFishSchoolOptions } from '../Life/FishSchool.ts';
import type ShelterZone from '../Colliders/ShelterZone.ts';
import type ISceneContext from './ISceneContext.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';
import type { ModelName } from '../../Config/assets.ts';
import type { IPropPlacement } from './IPropPlacement.ts';

/**
 * One place along the descent. Owns its props and life, and hides itself when the camera is too far
 * away to see it.
 */
export default abstract class DiveScene extends Group implements IDisposable {
	/** Extra distance beyond the scene radius it stays drawn; past this the fog has swallowed it. */
	private static readonly DRAW_MARGIN = 120;

	public readonly config: ISceneConfig;
	public readonly centre: Vector3;

	protected readonly context: ISceneContext;
	protected readonly random: SeededRandom;
	/** Enclosed spaces: inside them the sun is dimmed. */
	protected readonly shelters: ShelterZone[] = [];

	/** Places nothing may be scattered into (a hull, a building), horizontally. */
	protected readonly keepClear: { readonly centre: Vector3; readonly radius: number }[] = [];

	private readonly _disposables: IDisposable[] = [];
	/** Instanced props big enough to block the camera; cleared off its path once the path is known. */
	private readonly _obstacles: {
		readonly mesh: InstancedMesh;
		readonly placements: readonly IPropPlacement[];
		readonly size: number;
	}[] = [];

	protected constructor(config: ISceneConfig, context: ISceneContext, seed: number) {
		super();

		this.name = config.label;
		this.config = config;
		this.context = context;
		this.random = new SeededRandom(seed);
		this.centre = new Vector3(canyonCentre(config.z), floorAt(config.z), config.z);
	}

	public shelterAt(point: Vector3): number {
		return this.shelters.reduce((cover, zone) => Math.max(cover, zone.coverAt(point)), 0);
	}

	public abstract update(frame: IFrameContext): void;

	public cull(camera: Vector3): void {
		this.visible = camera.distanceTo(this.centre) < this.config.radius + DiveScene.DRAW_MARGIN;
	}

	/**
	 * Hides every obstacle the camera would pass through.
	 * @param path points along the camera's way, a few metres apart
	 * @param clearance metres kept free around the camera
	 */
	public clearPath(path: readonly Vector3[], clearance: number): void {
		const matrix = new Matrix4();
		const hidden = new Matrix4().makeScale(0, 0, 0);

		for (const { mesh, placements, size } of this._obstacles) {
			placements.forEach((placement, index) => {
				const scale = typeof placement.scale === 'number' ? placement.scale : placement.scale.x;
				const reach = clearance + scale * size * 0.5;

				if (path.some((point) => point.distanceToSquared(placement.position) < reach * reach)) {
					mesh.getMatrixAt(index, matrix);
					mesh.setMatrixAt(index, hidden);
				}
			});

			mesh.instanceMatrix.needsUpdate = true;
		}
	}

	public override dispose(): void {
		this._disposables.forEach((disposable) => disposable.dispose());
		super.dispose();
	}

	protected own<TObject extends Object3D & IDisposable>(object: TObject): TObject {
		this._disposables.push(object);
		this.add(object);

		return object;
	}

	/** A point on the seabed, lifted by `lift` metres. */
	protected ground(x: number, z: number, lift = 0): Vector3 {
		return new Vector3(x, this.context.terrain.heightAt(x, z) + lift, z);
	}

	/** Random points on the canyon floor around the scene, keeping off the walls. */
	protected scatter(count: number, radius: number, lift = 0, keepOff = 0.42): Vector3[] {
		const points: Vector3[] = [];
		let attempts = 0;

		while (points.length < count && attempts < count * 20) {
			attempts++;

			const z = this.centre.z + this.random.range(-radius, radius);
			const width = canyonWidthAt(z) * keepOff;
			const x = canyonCentre(z) + this.random.range(-width, width);

			const isClear = this.keepClear.every((zone) => Math.hypot(x - zone.centre.x, z - zone.centre.z) > zone.radius);

			if (isClear && Math.hypot(x - this.centre.x, z - this.centre.z) <= radius) {
				points.push(this.ground(x, z, lift));
			}
		}

		return points;
	}

	protected placements(
		points: readonly Vector3[],
		minScale: number,
		maxScale: number,
		colors?: readonly string[]
	): IPropPlacement[] {
		return points.map((position, index) => {
			const color = colors?.[index % colors.length];

			return {
				position,
				scale: this.random.range(minScale, maxScale),
				rotation: new Euler(
					this.random.range(-0.15, 0.15),
					this.random.range(0, Math.PI * 2),
					this.random.range(-0.15, 0.15)
				),
				...(color ? { color } : {})
			};
		});
	}

	/**
	 * A glTF model instanced at many placements: one draw call per mesh of the model.
	 * Placements are grounded: the model's base is set on the given point and sunk a little into the
	 * sand, so nothing floats on a slope.
	 * @param options.size model size in metres at scale 1 (the longest side is normalised to this)
	 * @param options.sink fraction of the height pushed into the ground
	 * @param options.isObstacle the camera path is cleared of these
	 * @param options.material own copies of the model's materials, tinted and/or extra patches
	 * @returns the materials used, e.g. to make them glow later
	 */
	protected instancedModel(
		name: ModelName,
		placements: readonly IPropPlacement[],
		options: {
			readonly size?: number;
			readonly sink?: number;
			readonly isObstacle?: boolean;
			/** Lying on its side (rotated 90° about X): rests on its flank instead of its base. */
			readonly isLying?: boolean;
			/** Keep the placement heights as given (e.g. on top of another model) instead of resting on the seabed. */
			readonly isAboveGround?: boolean;
			/** Use only this piece of a model that is a set of separate objects (see AssetLibrary.pieces). */
			readonly piece?: number;
			readonly material?: { readonly color?: string; readonly patches?: readonly IMaterialPatch[] };
		} = {}
	): MeshStandardMaterial[] {
		const materials: MeshStandardMaterial[] = [];

		if (placements.length === 0) {
			return materials;
		}

		const parts =
			options.piece === undefined
				? this.context.assets.parts(name)
				: this.context.assets.pieces(name).filter((_part, index) => index === options.piece);
		const bounds = new Box3();
		parts.forEach((part) => {
			part.geometry.computeBoundingBox();
			bounds.union(part.geometry.boundingBox ?? new Box3());
		});

		const dimensions = bounds.getSize(new Vector3());
		const normalise =
			(options.size ?? Math.max(dimensions.x, dimensions.y, dimensions.z)) /
			Math.max(dimensions.x, dimensions.y, dimensions.z);
		const sink = options.sink ?? 0.15;
		const matrix = new Matrix4();
		const rotation = new Quaternion();
		const scale = new Vector3();
		const position = new Vector3();
		const tint = new Color();

		const grounded = placements.map((placement) => {
			const factor = typeof placement.scale === 'number' ? placement.scale : placement.scale.y;
			const footprint =
				(options.isLying ? dimensions.y : Math.max(dimensions.x, dimensions.z)) * normalise * factor * 0.5;
			position.copy(placement.position);

			// Rest on the lowest seabed under the whole footprint: on a slope nothing hangs in the water
			if (!options.isAboveGround) {
				position.y = this.floorUnder(position.x, position.z, footprint);
			}

			if (options.isLying) {
				// On its side the model's thickness is what touches the ground
				const radius = (Math.max(dimensions.x, dimensions.z) / 2) * normalise * factor;
				position.y += radius * (1 - sink);
			} else {
				const height = dimensions.y * normalise * factor;
				position.y += -bounds.min.y * normalise * factor - height * sink;
			}

			return { ...placement, position: position.clone() };
		});

		for (const part of parts) {
			const material = options.material
				? this.ownMaterial(part.material as MeshStandardMaterial, options.material)
				: part.material;
			const mesh = new InstancedMesh(part.geometry, material, grounded.length);
			materials.push(material as MeshStandardMaterial);

			grounded.forEach((placement, index) => {
				rotation.setFromEuler(placement.rotation ?? new Euler());
				scale
					.copy(typeof placement.scale === 'number' ? new Vector3().setScalar(placement.scale) : placement.scale)
					.multiplyScalar(normalise);
				mesh.setMatrixAt(index, matrix.compose(placement.position, rotation, scale));

				if (placement.color) {
					mesh.setColorAt(index, tint.set(placement.color));
				}
			});

			mesh.computeBoundingSphere();
			mesh.matrixAutoUpdate = false;
			this._disposables.push({ dispose: () => part.geometry.dispose() });
			this.add(mesh);

			if (options.isObstacle) {
				this._obstacles.push({ mesh, placements: grounded, size: Math.max(dimensions.x, dimensions.z) * normalise });
			}
		}

		return materials;
	}

	/** A scene-owned copy of a model material (a clone loses its shader patches, so they're applied again). */
	private ownMaterial(
		source: MeshStandardMaterial,
		options: { readonly color?: string; readonly patches?: readonly IMaterialPatch[] }
	): MeshStandardMaterial {
		const material = source.clone();

		if (options.color) {
			material.color.set(options.color);
		}

		patchMaterial(material, this.context.water.caustics, ...(options.patches ?? []));
		this._disposables.push(material);

		return material;
	}

	/** A single copy of a model, scaled so its longest side is `size` metres, resting its base at `position`. */
	/**
	 * A single copy of a model, scaled so its longest side is `size` metres. It rests on the lowest
	 * seabed under its footprint (sunk by `sink` of its height), unless `isAboveGround` keeps `position.y`.
	 */
	protected placeModel(
		name: ModelName,
		position: Vector3,
		size: number,
		rotation = new Euler(),
		options: { readonly sink?: number; readonly isAboveGround?: boolean } = {}
	): Object3D {
		const model = this.context.assets.model(name);
		const box = new Box3().setFromObject(model);
		const dimensions = box.getSize(new Vector3());
		const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);
		const base = options.isAboveGround
			? position.y
			: this.floorUnder(position.x, position.z, Math.max(dimensions.x, dimensions.z) * scale * 0.5);

		model.scale.setScalar(scale);
		model.rotation.copy(rotation);
		model.position.set(
			position.x,
			base - box.min.y * scale - dimensions.y * scale * (options.sink ?? 0.04),
			position.z
		);
		this.add(model);

		return model;
	}

	/** The lowest seabed under a round footprint: the centre and a ring of eight points around it. */
	protected floorUnder(x: number, z: number, radius: number): number {
		let lowest = this.context.terrain.heightAt(x, z);

		for (let i = 0; i < 8; i++) {
			const angle = (i / 8) * Math.PI * 2;
			lowest = Math.min(
				lowest,
				this.context.terrain.heightAt(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius)
			);
		}

		return lowest;
	}

	protected school(centre: Vector3, options: IFishSchoolOptions): FishSchool {
		const school = this.own(new FishSchool(this.context.water, this.context.patches, this.context.fish, options));
		school.position.copy(centre);

		return school;
	}

	/**
	 * Rune stones, each slab of the Elder Stones set placed on its own (cycling through its carvings)
	 * and grounded on its own.
	 * @returns their materials (own copies), to light the runes later
	 */
	protected runeStones(placements: readonly IPropPlacement[], size: number): MeshStandardMaterial[] {
		const kinds = this.context.assets.pieces('elder_stones').length;
		const materials: MeshStandardMaterial[] = [];

		for (let piece = 0; piece < kinds; piece++) {
			const mine = placements.filter((_placement, index) => index % kinds === piece);
			materials.push(...this.instancedModel('elder_stones', mine, { size, sink: 0.08, piece, material: {} }));
		}

		return materials;
	}

	/** A few big, slow fish patrolling wide circles: something large is always moving out in the murk. */
	protected predators(centre: Vector3, count: number, radius: number, seed: number): void {
		this.school(centre, {
			count,
			radius,
			height: 6,
			speed: 0.05,
			length: 2.6,
			colors: ['#7d8a90', '#5f6b70'],
			seed
		});
	}

	/** Lanternfish: a swarm of tiny glowing fish for the dark. */
	protected lanternfish(centre: Vector3, count: number, glow: string, seed: number): void {
		this.school(centre, {
			count,
			radius: 7,
			height: 5,
			speed: 0.45,
			length: 0.16,
			colors: ['#1a2a33'],
			glow,
			seed
		});
	}
}
