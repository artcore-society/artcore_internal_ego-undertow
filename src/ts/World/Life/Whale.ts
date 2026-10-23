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
 * of the camera. Sent on its way, it carries on past the route's end, climbing away into the dark.
 */
export default class Whale extends Group implements IDisposable {
	/** The model's length (it is authored centred, head towards -Z): the undulation spans it. */
	private static readonly LENGTH = 15;
	private static readonly SAMPLES = 120;
	/** Leaving: m/s it settles into, and how fast it gets there. */
	private static readonly DEPARTURE_SPEED = 7;
	private static readonly DEPARTURE_EASING = 0.35;
	/** Leaving: metres climbed per metre swum, reached gradually. */
	private static readonly DEPARTURE_CLIMB = 0.35;
	/** Leaving: gone into the murk after this many metres past the route's end. */
	private static readonly DEPARTURE_REACH = 160;

	private readonly _circleCentre: Vector3;
	private readonly _circleRadius: number;
	private readonly _path: CatmullRomCurve3;
	private readonly _samples: Vector3[];
	private readonly _body: Mesh;
	private readonly _length: number;
	private readonly _end: Vector3;
	private readonly _endDirection: Vector3;
	private readonly _target = new Vector3();
	private readonly _ahead = new Vector3();
	/** Metres along its road (the route, then on past its end), or null while circling. */
	private _distance: number | null = null;
	private _isDeparting = false;
	/** m/s along its road: followed while leading, so leaving carries on at the same pace. */
	private _speed = 0;
	private _lastDistance = 0;
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
		this._length = this._path.getLength();
		this._end = this._path.getPointAt(1);
		// Level heading of the route's end: it climbs away by itself
		this._endDirection = this._path.getTangentAt(1).setY(0).normalize();

		const material = (part.material as MeshStandardMaterial).clone();
		this._body = new Mesh(part.geometry, patchMaterial(material, patches.undulate(Whale.LENGTH), water.caustics));
		this.add(this._body);

		this.position.copy(circleCentre).add(new Vector3(circleRadius, 0, 0));
	}

	/** Leads a follower: swims `lead` metres ahead of them along its route (never backwards). */
	public leadFrom(follower: Vector3, lead: number): void {
		if (this._isDeparting) {
			return;
		}

		let best = 0;
		let bestDistance = Infinity;

		this._samples.forEach((sample, index) => {
			const distance = sample.distanceToSquared(follower);

			if (distance < bestDistance) {
				bestDistance = distance;
				best = index;
			}
		});

		const ahead = Math.min(this._length, (best / Whale.SAMPLES) * this._length + lead);
		this._distance = Math.max(this._distance ?? 0, ahead);
	}

	/**
	 * Its job is done: it swims on down its road and away, and doesn't come back to lead again.
	 * @returns whether it set off just now
	 */
	public depart(): boolean {
		if (this._distance === null || this._isDeparting) {
			return false;
		}

		this._isDeparting = true;

		return true;
	}

	/** Back to circling the Whale Road, e.g. when the journey restarts. */
	public reset(): void {
		this._distance = null;
		this._isDeparting = false;
		this._speed = 0;
		this.visible = true;
	}

	public update(elapsed: number, delta: number): void {
		if (this._distance !== null) {
			if (this._isDeparting) {
				this._speed = damp(this._speed, Whale.DEPARTURE_SPEED, Whale.DEPARTURE_EASING, delta);
				this._distance += this._speed * delta;
				this.visible = this._distance < this._length + Whale.DEPARTURE_REACH;
			} else if (delta > 0) {
				this._speed = damp(this._speed, (this._distance - this._lastDistance) / delta, 2, delta);
			}

			this._lastDistance = this._distance;

			this.roadPoint(this._distance, this._target);
			this.roadPoint(this._distance + 3, this._ahead);
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

	/** A point `distance` metres along its road: the route, then straight on from its end, climbing ever more steeply. */
	private roadPoint(distance: number, target: Vector3): void {
		if (distance <= this._length) {
			this._path.getPointAt(distance / this._length, target);

			return;
		}

		const beyond = distance - this._length;
		// The climb eases in over the first 40 m, so the road bends up without a kink
		const climb = Whale.DEPARTURE_CLIMB * (beyond - 40 * (1 - Math.exp(-beyond / 40)));
		target
			.copy(this._end)
			.addScaledVector(this._endDirection, beyond)
			.setY(this._end.y + climb);
	}

	private circlePoint(angle: number, target: Vector3): void {
		target.set(
			this._circleCentre.x + Math.cos(angle) * this._circleRadius,
			this._circleCentre.y + Math.sin(angle * 1.7) * 5,
			this._circleCentre.z + Math.sin(angle) * this._circleRadius
		);
	}
}
