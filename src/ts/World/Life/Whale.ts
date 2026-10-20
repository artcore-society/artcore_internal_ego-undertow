import {
	BoxGeometry,
	CatmullRomCurve3,
	DoubleSide,
	Group,
	LatheGeometry,
	Mesh,
	MeshLambertMaterial,
	Shape,
	ShapeGeometry,
	Vector2,
	Vector3,
	type BufferGeometry
} from 'three';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * A humpback that circles the Whale Road, and when asked, leads the way down:
 * it stays a little ahead of the diver along its path and waits if the diver falls behind.
 */
export default class Whale extends Group implements IDisposable {
	private static readonly LENGTH = 15;
	private static readonly SAMPLES = 120;
	private static readonly LEAD = 0.07;
	private static readonly CRUISE = 0.012;

	private readonly _circleCentre: Vector3;
	private readonly _circleRadius: number;
	private readonly _path: CatmullRomCurve3;
	private readonly _samples: Vector3[];
	private readonly _geometries: BufferGeometry[] = [];
	private readonly _materials: MeshLambertMaterial[] = [];
	private readonly _target = new Vector3();
	private readonly _ahead = new Vector3();
	private readonly _flukes = new Group();
	private _isGuiding = false;
	private _progress = 0;
	private _angle = 0;
	private _heading = 0;

	constructor(
		water: WaterUniforms,
		patches: LifePatches,
		circleCentre: Vector3,
		circleRadius: number,
		path: readonly Vector3[]
	) {
		super();

		this._circleCentre = circleCentre.clone();
		this._circleRadius = circleRadius;
		this._path = new CatmullRomCurve3([...path]);
		this._samples = this._path.getSpacedPoints(Whale.SAMPLES);

		const skin = patchMaterial(
			new MeshLambertMaterial({ color: '#33414d' }),
			patches.undulate(Whale.LENGTH),
			water.caustics
		);
		const belly = patchMaterial(new MeshLambertMaterial({ color: '#9aa7ad' }), water.caustics);
		this._materials.push(skin, belly);

		this.build(skin, belly);
	}

	public get isGuiding(): boolean {
		return this._isGuiding;
	}

	/** Start of the guiding path, where the whale waits before it leads. */
	public get pathStart(): Vector3 {
		return this._path.getPointAt(0);
	}

	public guide(enabled: boolean): void {
		this._isGuiding = enabled;
		this._progress = 0;
	}

	public update(diver: Vector3, elapsed: number, delta: number): void {
		if (this._isGuiding) {
			const diverProgress = this.progressOf(diver);
			const goal = Math.min(1, Math.max(this._progress, diverProgress + Whale.LEAD));
			this._progress = Math.min(goal, this._progress + Whale.CRUISE * delta * 3);
			this._path.getPointAt(this._progress, this._target);
			this._path.getPointAt(Math.min(1, this._progress + 0.01), this._ahead);
		} else {
			this._angle += delta * 0.045;
			this._target.set(
				this._circleCentre.x + Math.cos(this._angle) * this._circleRadius,
				this._circleCentre.y + Math.sin(this._angle * 1.7) * 6,
				this._circleCentre.z + Math.sin(this._angle) * this._circleRadius
			);
			this._ahead.set(
				this._circleCentre.x + Math.cos(this._angle + 0.05) * this._circleRadius,
				this._target.y,
				this._circleCentre.z + Math.sin(this._angle + 0.05) * this._circleRadius
			);
		}

		this.position.x = damp(this.position.x, this._target.x, 1.2, delta);
		this.position.y = damp(this.position.y, this._target.y, 1.2, delta);
		this.position.z = damp(this.position.z, this._target.z, 1.2, delta);

		const heading = Math.atan2(-(this._ahead.x - this._target.x), -(this._ahead.z - this._target.z));
		const turn = Math.atan2(Math.sin(heading - this._heading), Math.cos(heading - this._heading));
		this._heading += turn * Math.min(1, delta * 0.8);
		this.rotation.set(0, this._heading, Math.sin(elapsed * 0.3) * 0.08 - turn * 0.6);
		this._flukes.rotation.x = Math.sin(elapsed * 0.9) * 0.25;
	}

	public override dispose(): void {
		this._geometries.forEach((geometry) => geometry.dispose());
		this._materials.forEach((material) => material.dispose());
		super.dispose();
	}

	private progressOf(point: Vector3): number {
		let best = 0;
		let bestDistance = Infinity;

		this._samples.forEach((sample, index) => {
			const distance = sample.distanceToSquared(point);

			if (distance < bestDistance) {
				bestDistance = distance;
				best = index;
			}
		});

		return best / Whale.SAMPLES;
	}

	/** Body is a lathe along -Z (head) to +Z (tail); fins and flukes are flat shapes. */
	private build(skin: MeshLambertMaterial, belly: MeshLambertMaterial): void {
		const half = Whale.LENGTH / 2;
		const profile: Vector2[] = [];

		for (let i = 0; i <= 24; i++) {
			const t = i / 24;
			const radius = Math.sin(Math.pow(t, 0.62) * Math.PI) * 1.9 * (1 - t * 0.55) + 0.05;
			profile.push(new Vector2(radius, -half + t * Whale.LENGTH));
		}

		const body = new LatheGeometry(profile, 18).rotateX(Math.PI / 2).scale(1.05, 0.85, 1);
		const underside = new LatheGeometry(profile.slice(2, 17), 10, Math.PI * 0.75, Math.PI * 0.5)
			.rotateX(Math.PI / 2)
			.scale(1.07, 0.88, 1);
		this._geometries.push(body, underside);
		this.add(new Mesh(body, skin), new Mesh(underside, belly));

		const fin = new BoxGeometry(4.6, 0.12, 1.1).translate(2.3, 0, 0);
		this._geometries.push(fin);

		[1, -1].forEach((side) => {
			const mesh = new Mesh(fin, skin);
			mesh.position.set(side * 1.4, -0.7, -half + 4.2);
			mesh.rotation.set(0, side > 0 ? -0.45 : Math.PI + 0.45, side * -0.35);
			this.add(mesh);
		});

		const shape = new Shape();
		shape.moveTo(0, 0);
		shape.quadraticCurveTo(1.6, 0.3, 2.6, 1.6);
		shape.quadraticCurveTo(1.6, 1.1, 0, 0.9);
		shape.quadraticCurveTo(-1.6, 1.1, -2.6, 1.6);
		shape.quadraticCurveTo(-1.6, 0.3, 0, 0);

		const flukes = new ShapeGeometry(shape, 6).rotateX(Math.PI / 2);
		this._geometries.push(flukes);
		const flukeSkin = patchMaterial(new MeshLambertMaterial({ color: '#33414d', side: DoubleSide }));
		this._materials.push(flukeSkin);
		const flukeMesh = new Mesh(flukes, flukeSkin);
		this._flukes.add(flukeMesh);
		this._flukes.position.z = half - 0.4;
		this.add(this._flukes);
	}
}
