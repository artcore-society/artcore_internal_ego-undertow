import {
	AdditiveBlending,
	Color,
	Group,
	Mesh,
	MeshBasicMaterial,
	RingGeometry,
	SphereGeometry,
	type Camera,
	type Vector3
} from 'three';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * Marks a stop's hotspot in the world: a glowing core with pulses that face the camera. It follows its
 * target every frame, so it stays on things that move (the whale).
 */
export default class SignalBeacon extends Group implements IDisposable {
	private static readonly RING_COUNT = 3;
	private static readonly PULSE_SECONDS = 2.4;

	private readonly _core: Mesh<SphereGeometry, MeshBasicMaterial>;
	private readonly _ringGeometry = new RingGeometry(0.85, 1, 48, 1);
	private readonly _rings: Mesh<RingGeometry, MeshBasicMaterial>[] = [];
	private _intensity = 0;
	private _target: (() => Readonly<Vector3>) | null = null;

	constructor() {
		super();

		this._core = new Mesh(
			new SphereGeometry(0.5, 16, 12),
			new MeshBasicMaterial({ color: new Color('#7ffcf0').multiplyScalar(4), fog: false, transparent: true })
		);
		this.add(this._core);

		for (let i = 0; i < SignalBeacon.RING_COUNT; i++) {
			const ring = new Mesh(
				this._ringGeometry,
				new MeshBasicMaterial({
					color: new Color('#7ffcf0').multiplyScalar(2),
					transparent: true,
					depthWrite: false,
					blending: AdditiveBlending,
					fog: false
				})
			);
			this._rings.push(ring);
			this.add(ring);
		}

		this.visible = false;
	}

	/** @param target where the hotspot is now (read every frame); null to fade the beacon out where it is */
	public setTarget(target: (() => Readonly<Vector3>) | null): void {
		this._target = target;
	}

	public update(camera: Camera, elapsed: number, delta: number): void {
		if (this._target) {
			this.position.copy(this._target());
		}

		this._intensity += ((this._target ? 1 : 0) - this._intensity) * Math.min(1, delta * 3);
		this.visible = this._intensity > 0.01;

		if (!this.visible) {
			return;
		}

		const distance = camera.position.distanceTo(this.position);
		// Readable from afar, a small spark up close: never fills the screen
		const scale = Math.min(3, Math.max(0.18, distance * 0.03));

		this._core.scale.setScalar(scale * (0.9 + Math.sin(elapsed * 4) * 0.1));
		this._core.material.opacity = this._intensity;

		this._rings.forEach((ring, index) => {
			const t = (((elapsed / SignalBeacon.PULSE_SECONDS + index / SignalBeacon.RING_COUNT) % 1) + 1) % 1;

			ring.quaternion.copy(camera.quaternion);
			ring.scale.setScalar(scale * (0.6 + t * 2.4));
			ring.material.opacity = (1 - t) * 0.55 * this._intensity;
		});
	}

	public override dispose(): void {
		this._core.geometry.dispose();
		this._core.material.dispose();
		this._ringGeometry.dispose();
		this._rings.forEach((ring) => ring.material.dispose());
		super.dispose();
	}
}
