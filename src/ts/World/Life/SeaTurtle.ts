import { AnimationMixer, Box3, Group, Vector3, type AnimationClip, type Object3D } from 'three';
import type IDisposable from '../../Contracts/IDisposable.ts';

/** A sea turtle (rigged model, see CREDITS.md) paddling a slow, rising and falling loop over the reef. */
export default class SeaTurtle extends Group implements IDisposable {
	private static readonly LENGTH = 1.3;

	private readonly _mixer: AnimationMixer;
	private readonly _centre: Vector3;
	private readonly _radius: number;
	private readonly _speed: number;
	private readonly _phase: number;

	/**
	 * @param model a clone of the turtle model
	 * @param heading model-space yaw that points the head along -Z
	 */
	constructor(
		model: Object3D,
		clips: readonly AnimationClip[],
		centre: Vector3,
		radius: number,
		speed: number,
		phase: number,
		heading: number
	) {
		super();

		this._centre = centre.clone();
		this._radius = radius;
		this._speed = speed;
		this._phase = phase;

		const box = new Box3().setFromObject(model);
		const size = box.getSize(new Vector3());
		model.scale.setScalar(SeaTurtle.LENGTH / Math.max(size.x, size.y, size.z));
		model.rotation.y = heading;
		this.add(model);

		this._mixer = new AnimationMixer(model);
		clips.forEach((clip) => {
			const action = this._mixer.clipAction(clip);
			action.timeScale = 0.6 + speed * 2;
			action.time = phase;
			action.play();
		});
	}

	public update(elapsed: number, delta: number): void {
		const angle = this._phase + elapsed * this._speed;

		this.position.set(
			this._centre.x + Math.cos(angle) * this._radius,
			this._centre.y + Math.sin(angle * 0.6) * 1.8,
			this._centre.z + Math.sin(angle) * this._radius
		);
		// Face along the loop's tangent (forward is -Z), nose tilted with the climb
		this.rotation.set(-Math.cos(angle * 0.6) * 0.15, Math.PI - angle, Math.sin(elapsed * 0.4) * 0.06, 'YXZ');
		this._mixer.update(delta);
	}

	public override dispose(): void {
		this._mixer.stopAllAction();
		super.dispose();
	}
}
