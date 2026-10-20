import {
	BoxGeometry,
	CapsuleGeometry,
	Color,
	CylinderGeometry,
	Group,
	Mesh,
	MeshLambertMaterial,
	SphereGeometry,
	Vector3,
	type BufferGeometry
} from 'three';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * A procedural diver lying in the swim position, facing -Z: wetsuit, tank, mask and long fins.
 * Legs pivot at the hips for the kick cycle.
 */
export default class DiverModel extends Group implements IDisposable {
	/** Where the regulator exhales, in model space. */
	public readonly regulator = new Vector3(0, 0.12, -0.95);
	/** Where the head lamp sits, in model space. */
	public readonly lampMount = new Vector3(0, 0.22, -0.98);

	private readonly _body = new Group();
	private readonly _leftLeg = new Group();
	private readonly _rightLeg = new Group();
	private readonly _leftArm = new Group();
	private readonly _rightArm = new Group();
	private readonly _geometries: BufferGeometry[] = [];
	private readonly _materials: MeshLambertMaterial[] = [];
	private _kickPhase = 0;

	constructor(water: WaterUniforms) {
		super();

		const suit = this.material(water, '#1d2733');
		const accent = this.material(water, '#ff7a59');
		const tank = this.material(water, '#f2b84b');
		const skin = this.material(water, '#c98d6c');
		const fin = this.material(water, '#2ad0c4');
		const glass = new MeshLambertMaterial({ color: '#0b2530', emissive: new Color('#1f6f80'), emissiveIntensity: 0.4 });
		this._materials.push(glass);

		// Torso along Z
		this.part(this._body, this.geometry(new CapsuleGeometry(0.27, 0.8, 4, 10).rotateX(Math.PI / 2)), suit, 0, 0, 0);
		this.part(this._body, this.geometry(new BoxGeometry(0.06, 0.05, 0.8)), accent, 0.2, 0.12, -0.05);
		this.part(this._body, this.geometry(new BoxGeometry(0.06, 0.05, 0.8)), accent, -0.2, 0.12, -0.05);

		// Head, mask and hood
		this.part(this._body, this.geometry(new SphereGeometry(0.19, 14, 10)), suit, 0, 0.08, -0.78);
		this.part(this._body, this.geometry(new BoxGeometry(0.26, 0.13, 0.08)), glass, 0, 0.06, -0.93);
		this.part(this._body, this.geometry(new SphereGeometry(0.05, 8, 6)), skin, 0, -0.05, -0.93);

		// Tank on the back
		this.part(
			this._body,
			this.geometry(new CylinderGeometry(0.14, 0.14, 0.72, 12).rotateX(Math.PI / 2)),
			tank,
			0,
			0.3,
			0.05
		);
		this.part(this._body, this.geometry(new CylinderGeometry(0.05, 0.05, 0.12, 8)), suit, 0, 0.3, -0.36).rotation.x =
			Math.PI / 2;

		// Arms tucked along the body, streamlined
		this.limb(this._leftArm, suit, skin, 0.3, -0.45, 0.62);
		this.limb(this._rightArm, suit, skin, -0.3, -0.45, 0.62);

		// Legs and fins
		this.leg(this._leftLeg, suit, fin, 0.13);
		this.leg(this._rightLeg, suit, fin, -0.13);

		this.add(this._body);
	}

	/**
	 * @param effort 0..1 how hard the diver is kicking
	 * @param bank roll in radians from turning
	 */
	public animate(effort: number, bank: number, pitch: number, elapsed: number, delta: number): void {
		this._kickPhase += delta * (2.2 + effort * 5.5);

		const amplitude = 0.12 + effort * 0.38;
		const kick = Math.sin(this._kickPhase) * amplitude;

		this._leftLeg.rotation.x = kick;
		this._rightLeg.rotation.x = -kick;
		this._leftArm.rotation.z = Math.sin(elapsed * 0.9) * 0.05;
		this._rightArm.rotation.z = -Math.sin(elapsed * 0.9) * 0.05;

		this._body.rotation.z = bank;
		this._body.rotation.x = pitch;
		this._body.position.y = Math.sin(elapsed * 1.1) * 0.04 + Math.sin(this._kickPhase) * 0.015 * effort;
	}

	public override dispose(): void {
		this._geometries.forEach((geometry) => geometry.dispose());
		this._materials.forEach((material) => material.dispose());
		super.dispose();
	}

	private limb(
		pivot: Group,
		suit: MeshLambertMaterial,
		skin: MeshLambertMaterial,
		x: number,
		z: number,
		length: number
	): void {
		pivot.position.set(x, 0.02, z);
		this.part(
			pivot,
			this.geometry(new CapsuleGeometry(0.075, length, 3, 8).rotateX(Math.PI / 2)),
			suit,
			0,
			0,
			length / 2
		);
		this.part(pivot, this.geometry(new SphereGeometry(0.07, 8, 6)), skin, 0, 0, length + 0.08);
		this._body.add(pivot);
	}

	private leg(pivot: Group, suit: MeshLambertMaterial, fin: MeshLambertMaterial, x: number): void {
		pivot.position.set(x, -0.02, 0.5);
		this.part(pivot, this.geometry(new CapsuleGeometry(0.1, 0.85, 3, 8).rotateX(Math.PI / 2)), suit, 0, 0, 0.5);

		const blade = this.geometry(new BoxGeometry(0.22, 0.025, 0.6));
		const position = blade.getAttribute('position');

		// Flare the blade wider at its tip
		for (let i = 0; i < position.count; i++) {
			if (position.getZ(i) > 0) {
				position.setX(i, position.getX(i) * 1.6);
			}
		}

		this.part(pivot, blade, fin, 0, -0.03, 1.25);
		this._body.add(pivot);
	}

	private part(
		parent: Group,
		geometry: BufferGeometry,
		material: MeshLambertMaterial,
		x: number,
		y: number,
		z: number
	): Mesh {
		const mesh = new Mesh(geometry, material);
		mesh.position.set(x, y, z);
		parent.add(mesh);

		return mesh;
	}

	private geometry<TGeometry extends BufferGeometry>(geometry: TGeometry): TGeometry {
		this._geometries.push(geometry);

		return geometry;
	}

	private material(water: WaterUniforms, color: string): MeshLambertMaterial {
		const material = patchMaterial(new MeshLambertMaterial({ color }), water.caustics);
		this._materials.push(material);

		return material;
	}
}
