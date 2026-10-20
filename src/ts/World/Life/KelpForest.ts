import {
	BufferGeometry,
	CanvasTexture,
	Color,
	CylinderGeometry,
	DoubleSide,
	InstancedMesh,
	Matrix4,
	MeshStandardMaterial,
	PlaneGeometry,
	Quaternion,
	SRGBColorSpace,
	Vector3
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

export interface IKelpStalk {
	readonly position: Vector3;
	/** Uniform scale of the stalk (1 = the forest's base height). */
	readonly scale: number;
}

/**
 * Giant kelp: a thin stipe with alternating fronds, instanced, swaying in the vertex shader.
 * The frond texture (blade shape, midrib, veins) is painted on a canvas: nothing to download.
 */
export default class KelpForest extends InstancedMesh<BufferGeometry, MeshStandardMaterial> implements IDisposable {
	private static readonly FRONDS_PER_METRE = 1.3;

	private readonly _texture: CanvasTexture;

	constructor(water: WaterUniforms, patches: LifePatches, stalks: readonly IKelpStalk[], height: number, seed: number) {
		const texture = KelpForest.paintFrond();
		const material = new MeshStandardMaterial({
			map: texture,
			alphaTest: 0.45,
			side: DoubleSide,
			roughness: 0.55,
			// Light through the blades: kelp glows amber-green when backlit
			emissive: new Color('#3d4a12'),
			emissiveIntensity: 0.35
		});

		super(
			KelpForest.createGeometry(height, seed),
			patchMaterial(material, water.caustics, patches.sway(height * 0.09, height)),
			stalks.length
		);

		this._texture = texture;

		const matrix = new Matrix4();
		const rotation = new Quaternion();
		const up = new Vector3(0, 1, 0);
		const scale = new Vector3();
		const color = new Color();
		const random = new SeededRandom(seed + 1);

		stalks.forEach((stalk, index) => {
			rotation.setFromAxisAngle(up, random.range(0, Math.PI * 2));
			scale.setScalar(stalk.scale);
			matrix.compose(stalk.position, rotation, scale);
			this.setMatrixAt(index, matrix);
			this.setColorAt(index, color.setHSL(random.range(0.12, 0.2), random.range(0.45, 0.65), random.range(0.42, 0.58)));
		});

		this.computeBoundingSphere();
	}

	/** One stalk: a stipe from 0 to `height` with fronds alternating up its length, drooping slightly. */
	private static createGeometry(height: number, seed: number): BufferGeometry {
		const random = new SeededRandom(seed);
		const parts: BufferGeometry[] = [
			new CylinderGeometry(0.03, 0.06, height, 5, 8).translate(0, height / 2, 0).toNonIndexed()
		];
		const count = Math.round(height * KelpForest.FRONDS_PER_METRE);

		for (let i = 0; i < count; i++) {
			const y = (0.08 + (i / count) * 0.92) * height;
			const length = random.range(1.6, 2.6) * (1 - (i / count) * 0.3);
			const frond = new PlaneGeometry(0.55, length, 1, 5).translate(0, length / 2, 0);
			const position = frond.getAttribute('position');

			// Curve the blade outwards and down, like it's hanging in the current
			for (let v = 0; v < position.count; v++) {
				const t = position.getY(v) / length;
				position.setZ(v, Math.sin(t * Math.PI * 0.5) * length * 0.35);
				position.setY(v, position.getY(v) * (1 - t * 0.25));
			}

			frond.computeVertexNormals();
			frond.rotateX(-0.6 + random.range(-0.2, 0.2));
			frond.rotateY((i % 2 === 0 ? 0 : Math.PI) + random.range(-0.7, 0.7) + i * 0.4);
			frond.translate(0, y, 0);
			parts.push(frond.toNonIndexed());
		}

		const geometry = mergeGeometries(parts) ?? parts[0] ?? new BufferGeometry();
		parts.forEach((part) => part !== geometry && part.dispose());

		return geometry;
	}

	/** A kelp blade on a canvas: tapered, ruffled edges, a pale midrib and fine veins, darker at the base. */
	private static paintFrond(): CanvasTexture {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 256;
		const context = canvas.getContext('2d');

		if (context) {
			const gradient = context.createLinearGradient(0, 256, 0, 0);
			gradient.addColorStop(0, '#5b4a1c');
			gradient.addColorStop(0.5, '#8a7a2c');
			gradient.addColorStop(1, '#a89a3e');

			context.fillStyle = gradient;
			context.beginPath();
			context.moveTo(32, 256);

			for (let y = 256; y >= 0; y -= 8) {
				const t = 1 - y / 256;
				const width = Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.9) * 28 + Math.sin(y * 0.35) * 2.5;
				context.lineTo(32 + width, y);
			}

			for (let y = 0; y <= 256; y += 8) {
				const t = 1 - y / 256;
				const width = Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.9) * 28 + Math.cos(y * 0.31) * 2.5;
				context.lineTo(32 - width, y);
			}

			context.fill();

			context.strokeStyle = 'rgba(220, 210, 140, 0.55)';
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(32, 256);
			context.lineTo(32, 6);
			context.stroke();

			context.strokeStyle = 'rgba(40, 30, 10, 0.25)';
			context.lineWidth = 1;

			for (let y = 240; y > 10; y -= 10) {
				context.beginPath();
				context.moveTo(32, y);
				context.lineTo(6, y - 14);
				context.moveTo(32, y);
				context.lineTo(58, y - 14);
				context.stroke();
			}
		}

		const texture = new CanvasTexture(canvas);
		texture.colorSpace = SRGBColorSpace;

		return texture;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		this._texture.dispose();
		super.dispose();
	}
}
