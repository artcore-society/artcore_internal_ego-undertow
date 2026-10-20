import {
	BufferGeometry,
	Color,
	DoubleSide,
	InstancedMesh,
	Matrix4,
	MeshLambertMaterial,
	PlaneGeometry,
	Quaternion,
	Vector3
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

export interface IKelpStalk {
	readonly position: Vector3;
	readonly height: number;
}

/** Instanced kelp: two crossed tapering ribbons per stalk, swaying in the vertex shader. */
export default class KelpForest extends InstancedMesh<BufferGeometry, MeshLambertMaterial> implements IDisposable {
	private static createGeometry(): BufferGeometry {
		const blade = new PlaneGeometry(0.7, 1, 1, 12).translate(0, 0.5, 0);
		const position = blade.getAttribute('position');

		// Taper towards the tip and ripple the edge a little
		for (let i = 0; i < position.count; i++) {
			const y = position.getY(i);
			position.setX(i, position.getX(i) * (1 - y * 0.6) * (1 + Math.sin(y * 40) * 0.12));
		}

		return mergeGeometries([blade, blade.clone().rotateY(Math.PI / 2)]) ?? blade;
	}

	constructor(water: WaterUniforms, patches: LifePatches, stalks: readonly IKelpStalk[], seed: number) {
		super(
			KelpForest.createGeometry(),
			patchMaterial(new MeshLambertMaterial({ side: DoubleSide }), patches.sway(1.6), water.caustics),
			stalks.length
		);

		const matrix = new Matrix4();
		const rotation = new Quaternion();
		const up = new Vector3(0, 1, 0);
		const scale = new Vector3();
		const color = new Color();

		stalks.forEach((stalk, index) => {
			const variation = Math.sin(index * 12.9898 + seed) * 0.5 + 0.5;

			rotation.setFromAxisAngle(up, variation * Math.PI);
			scale.set(1 + variation * 0.8, stalk.height, 1 + variation * 0.8);
			matrix.compose(stalk.position, rotation, scale);
			this.setMatrixAt(index, matrix);
			this.setColorAt(index, color.setHSL(0.2 + variation * 0.08, 0.5, 0.26 + variation * 0.1));
		});

		this.computeBoundingSphere();
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
