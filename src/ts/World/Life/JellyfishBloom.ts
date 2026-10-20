import {
	BufferGeometry,
	Color,
	CylinderGeometry,
	InstancedMesh,
	Matrix4,
	MeshBasicMaterial,
	Quaternion,
	SphereGeometry,
	Vector3
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import type LifePatches from './LifePatches.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/** Bioluminescent jellyfish: unlit, glowing past the bloom threshold, pulsing on the GPU. */
export default class JellyfishBloom extends InstancedMesh<BufferGeometry, MeshBasicMaterial> implements IDisposable {
	private static createGeometry(): BufferGeometry {
		const bell = new SphereGeometry(0.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1).toNonIndexed();
		const parts: BufferGeometry[] = [bell];

		for (let i = 0; i < 5; i++) {
			const angle = (i / 5) * Math.PI * 2;
			parts.push(
				new CylinderGeometry(0.025, 0.008, 2.2, 3, 6)
					.translate(Math.cos(angle) * 0.32, -1.1, Math.sin(angle) * 0.32)
					.toNonIndexed()
			);
		}

		return mergeGeometries(parts) ?? bell;
	}

	constructor(patches: LifePatches, positions: readonly Vector3[], tint: string) {
		super(
			JellyfishBloom.createGeometry(),
			patchMaterial(
				new MeshBasicMaterial({
					color: new Color(tint).multiplyScalar(2.4),
					transparent: true,
					opacity: 0.75,
					depthWrite: false
				}),
				patches.pulse
			),
			positions.length
		);

		const matrix = new Matrix4();
		const rotation = new Quaternion();
		const scale = new Vector3();

		positions.forEach((position, index) => {
			scale.setScalar(0.7 + ((index * 7) % 5) * 0.18);
			matrix.compose(position, rotation, scale);
			this.setMatrixAt(index, matrix);
		});

		this.computeBoundingSphere();
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
