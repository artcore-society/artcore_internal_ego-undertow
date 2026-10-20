import {
	BufferGeometry,
	Color,
	ConeGeometry,
	CylinderGeometry,
	IcosahedronGeometry,
	InstancedMesh,
	Matrix4,
	MeshStandardMaterial,
	Quaternion,
	Euler,
	SphereGeometry,
	TorusGeometry,
	Vector3,
	type Texture
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMaterial, type IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import { valueNoise } from '../../Helpers/noise.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

export interface IPropPlacement {
	readonly position: Vector3;
	readonly scale: Vector3 | number;
	readonly rotation?: Euler;
	readonly color?: string;
}

export const PropKind = {
	ROCK: 'rock',
	BRAIN_CORAL: 'brainCoral',
	BRANCH_CORAL: 'branchCoral',
	FAN_CORAL: 'fanCoral',
	TUBE_SPONGE: 'tubeSponge',
	ANEMONE: 'anemone',
	COLUMN: 'column',
	BLOCK: 'block',
	DOME: 'dome',
	TOWER: 'tower',
	ARCH: 'arch'
} as const;

export type PropKind = (typeof PropKind)[keyof typeof PropKind];

/**
 * Shared geometries for everything static, and the one way to place them: as instanced meshes,
 * so a whole reef of coral is a handful of draw calls. Geometries are built once and reused.
 */
export default class PropFactory implements IDisposable {
	private readonly _water: WaterUniforms;
	private readonly _geometries = new Map<PropKind, BufferGeometry>();
	private readonly _materials: MeshStandardMaterial[] = [];

	constructor(water: WaterUniforms) {
		this._water = water;
	}

	/**
	 * One instanced mesh for a list of placements; static, so its matrices never update again.
	 * @param color fallback tint for placements without their own colour
	 */
	public instanced(
		kind: PropKind,
		placements: readonly IPropPlacement[],
		color: string,
		options: { readonly map?: Texture; readonly roughness?: number } = {},
		...patches: IMaterialPatch[]
	): InstancedMesh {
		// Caustics first: other patches may read its world-position varying
		const material = patchMaterial(
			new MeshStandardMaterial({ color: '#ffffff', roughness: options.roughness ?? 0.85, map: options.map ?? null }),
			this._water.caustics,
			...patches
		);
		this._materials.push(material);

		const mesh = new InstancedMesh(this.geometry(kind), material, Math.max(1, placements.length));
		const matrix = new Matrix4();
		const rotation = new Quaternion();
		const scale = new Vector3();
		const tint = new Color();

		placements.forEach((placement, index) => {
			rotation.setFromEuler(placement.rotation ?? new Euler());
			scale.copy(typeof placement.scale === 'number' ? new Vector3().setScalar(placement.scale) : placement.scale);
			matrix.compose(placement.position, rotation, scale);
			mesh.setMatrixAt(index, matrix);
			mesh.setColorAt(index, tint.set(placement.color ?? color));
		});

		mesh.count = placements.length;
		mesh.computeBoundingSphere();
		mesh.matrixAutoUpdate = false;

		return mesh;
	}

	public geometry(kind: PropKind): BufferGeometry {
		let geometry = this._geometries.get(kind);

		if (!geometry) {
			geometry = this.build(kind);
			this._geometries.set(kind, geometry);
		}

		return geometry;
	}

	public dispose(): void {
		this._geometries.forEach((geometry) => geometry.dispose());
		this._materials.forEach((material) => material.dispose());
		this._geometries.clear();
	}

	private build(kind: PropKind): BufferGeometry {
		switch (kind) {
			case PropKind.ROCK:
				return PropFactory.lumpy(new IcosahedronGeometry(1, 1), 0.35, 1.3);
			case PropKind.BRAIN_CORAL:
				return PropFactory.lumpy(new SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), 0.08, 6);
			case PropKind.BRANCH_CORAL:
				return PropFactory.branches();
			case PropKind.FAN_CORAL:
				return new CylinderGeometry(1, 1, 0.06, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2).translate(0, 0.05, 0);
			case PropKind.TUBE_SPONGE:
				return PropFactory.tubes();
			case PropKind.ANEMONE:
				return PropFactory.anemone();
			case PropKind.COLUMN:
				return PropFactory.column();
			case PropKind.BLOCK:
				return PropFactory.lumpy(new IcosahedronGeometry(1, 0), 0, 1).scale(0.9, 0.7, 0.9);
			case PropKind.DOME:
				return new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
			case PropKind.TOWER:
				return mergeGeometries([
					new CylinderGeometry(0.8, 1, 1, 8, 1).translate(0, 0.5, 0).toNonIndexed(),
					new ConeGeometry(0.95, 0.35, 8).translate(0, 1.17, 0).toNonIndexed()
				]) as BufferGeometry;
			case PropKind.ARCH:
				return new TorusGeometry(1, 0.18, 6, 16, Math.PI);
		}
	}

	/** Displaces vertices along their normal with value noise, then re-shades flat for a faceted look. */
	private static lumpy(source: BufferGeometry, amount: number, frequency: number): BufferGeometry {
		const geometry = source.index ? source.toNonIndexed() : source.clone();
		const position = geometry.getAttribute('position');
		const point = new Vector3();

		for (let i = 0; i < position.count; i++) {
			point.fromBufferAttribute(position, i);
			const n = valueNoise(point.x * frequency + point.y * 2.1, point.z * frequency - point.y * 1.3);
			point.multiplyScalar(1 + n * amount);
			position.setXYZ(i, point.x, point.y, point.z);
		}

		geometry.computeVertexNormals();
		source.dispose();

		return geometry;
	}

	private static branches(): BufferGeometry {
		const parts: BufferGeometry[] = [];

		for (let i = 0; i < 7; i++) {
			const angle = (i / 7) * Math.PI * 2;
			const lean = 0.25 + (i % 3) * 0.2;
			const height = 0.7 + (i % 4) * 0.2;
			const branch = new CylinderGeometry(0.04, 0.08, height, 5, 1).translate(0, height / 2, 0);
			branch.rotateZ(Math.cos(angle) * lean);
			branch.rotateX(Math.sin(angle) * lean);
			parts.push(branch.toNonIndexed());
		}

		return mergeGeometries(parts) as BufferGeometry;
	}

	private static tubes(): BufferGeometry {
		const parts: BufferGeometry[] = [];

		for (let i = 0; i < 4; i++) {
			const height = 0.6 + i * 0.25;
			const tube = new CylinderGeometry(0.16, 0.12, height, 8, 1, true).translate(
				Math.cos(i * 2.4) * 0.22,
				height / 2,
				Math.sin(i * 2.4) * 0.22
			);
			parts.push(tube.toNonIndexed());
		}

		return mergeGeometries(parts) as BufferGeometry;
	}

	private static anemone(): BufferGeometry {
		const parts: BufferGeometry[] = [new CylinderGeometry(0.3, 0.35, 0.3, 10).translate(0, 0.15, 0).toNonIndexed()];

		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2;
			const tentacle = new ConeGeometry(0.04, 0.6, 4).translate(0, 0.3, 0);
			tentacle.rotateZ(Math.cos(angle) * 0.5);
			tentacle.rotateX(Math.sin(angle) * 0.5);
			tentacle.translate(Math.cos(angle) * 0.2, 0.3, Math.sin(angle) * 0.2);
			parts.push(tentacle.toNonIndexed());
		}

		return mergeGeometries(parts) as BufferGeometry;
	}

	/** Fluted column, 1 unit tall, base at 0. */
	private static column(): BufferGeometry {
		const shaft = new CylinderGeometry(0.42, 0.48, 1, 12, 6).translate(0, 0.5, 0);
		const position = shaft.getAttribute('position');

		for (let i = 0; i < position.count; i++) {
			const angle = Math.atan2(position.getZ(i), position.getX(i));
			const flute = 1 - Math.abs(Math.sin(angle * 6)) * 0.06;
			position.setX(i, position.getX(i) * flute);
			position.setZ(i, position.getZ(i) * flute);
		}

		shaft.computeVertexNormals();

		return shaft;
	}
}
