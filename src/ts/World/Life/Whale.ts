import { CatmullRomCurve3, Group, Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type { IModelPart } from '../../Assets/AssetLibrary.ts';

/**
 * A humpback (scanned model, see CREDITS.md). Its body flexes in the vertex shader as it swims. It
 * circles the Whale Road until the journey asks it to lead, then swims down its route a little ahead
 * of the camera.
 */
export default class Whale extends Group implements IDisposable {
	/** The model's length (it is authored centred, head towards -Z): the undulation spans it. */
	private static readonly LENGTH = 15;
	private static readonly SAMPLES = 120;

	private readonly _circleCentre: Vector3;
	private readonly _circleRadius: number;
	private readonly _path: CatmullRomCurve3;
	private readonly _samples: Vector3[];
	private readonly _body: Mesh;
	private readonly _target = new Vector3();
	private readonly _ahead = new Vector3();
	private _guide: number | null = null;
	private _angle = 0;
	private _heading = 0;
	private _pitch = 0;
	private _roll = 0;

	/** @param part the whale model */
	constructor(
		water: WaterUniforms,
		patches: LifePatches,
		part: IModelPart,
		circleCentre: Vector3,
		circleRadius: number,
		path: readonly Vector3[]
	) {
		super();

		this._circleCentre = circleCentre.clone();
		this._circleRadius = circleRadius;
		this._path = new CatmullRomCurve3([...path]);
		this._samples = this._path.getSpacedPoints(Whale.SAMPLES);

		const material = (part.material as MeshStandardMaterial).clone();
		this._body = new Mesh(part.geometry, patchMaterial(material, patches.undulate(Whale.LENGTH), water.caustics));
		this.add(this._body);

		this.position.copy(circleCentre).add(new Vector3(circleRadius, 0, 0));
	}

	/** Leads a follower: swims `lead` metres ahead of them along its route (never backwards). */
	public leadFrom(follower: Vector3, lead: number): void {
		let best = 0;
		let bestDistance = Infinity;

		this._samples.forEach((sample, index) => {
			const distance = sample.distanceToSquared(follower);

			if (distance < bestDistance) {
				bestDistance = distance;
				best = index;
			}
		});

		const ahead = best / Whale.SAMPLES + lead / this._path.getLength();
		this.setGuide(Math.max(this._guide ?? 0, ahead));
	}

	/** 0..1 along its route while leading; null to let it circle. */
	public setGuide(progress: number | null): void {
		this._guide = progress === null ? null : Math.min(1, Math.max(0, progress));
	}

	public update(elapsed: number, delta: number): void {
		if (this._guide !== null) {
			this._path.getPointAt(this._guide, this._target);
			this._path.getPointAt(Math.min(1, this._guide + 0.02), this._ahead);
		} else {
			this._angle += delta * 0.045;
			this.circlePoint(this._angle, this._target);
			this.circlePoint(this._angle + 0.05, this._ahead);
		}

		this.position.x = damp(this.position.x, this._target.x, 0.9, delta);
		this.position.y = damp(this.position.y, this._target.y, 0.9, delta);
		this.position.z = damp(this.position.z, this._target.z, 0.9, delta);

		const dx = this._ahead.x - this._target.x;
		const dz = this._ahead.z - this._target.z;
		const heading = Math.atan2(-dx, -dz);
		const turn = Math.atan2(Math.sin(heading - this._heading), Math.cos(heading - this._heading));
		// Nose down when diving, up when rising; banks into turns
		const pitch = Math.atan2(this._ahead.y - this._target.y, Math.hypot(dx, dz));

		this._heading += turn * Math.min(1, delta * 0.8);
		this._pitch = damp(this._pitch, pitch * 0.8, 1.2, delta);
		this._roll = damp(this._roll, -turn * 1.4, 1.5, delta);
		this.rotation.set(
			this._pitch + Math.sin(elapsed * 0.45) * 0.04,
			this._heading,
			this._roll + Math.sin(elapsed * 0.3) * 0.05,
			'YXZ'
		);
	}

	public override dispose(): void {
		this._body.geometry.dispose();
		(this._body.material as MeshStandardMaterial).dispose();
		super.dispose();
	}

	private circlePoint(angle: number, target: Vector3): void {
		target.set(
			this._circleCentre.x + Math.cos(angle) * this._circleRadius,
			this._circleCentre.y + Math.sin(angle * 1.7) * 5,
			this._circleCentre.z + Math.sin(angle) * this._circleRadius
		);
	}
}
