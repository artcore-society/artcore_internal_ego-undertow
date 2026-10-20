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

/** Marks where Mara's signal is coming from: a glowing core with pulses that face the camera. */
export default class SignalBeacon extends Group implements IDisposable {
	private static readonly RING_COUNT = 3;
	private static readonly PULSE_SECONDS = 2.4;

	private readonly _core: Mesh<SphereGeometry, MeshBasicMaterial>;
	private readonly _ringGeometry = new RingGeometry(0.85, 1, 48, 1);
	private readonly _rings: Mesh<RingGeometry, MeshBasicMaterial>[] = [];
	private _intensity = 0;
	private _isActive = false;

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

	public setTarget(target: Vector3 | null): void {
		this._isActive = target !== null;

		if (target) {
			this.position.copy(target);
		}
	}

	public update(camera: Camera, elapsed: number, delta: number): void {
		this._intensity += ((this._isActive ? 1 : 0) - this._intensity) * Math.min(1, delta * 3);
		this.visible = this._intensity > 0.01;

		if (!this.visible) {
			return;
		}

		const distance = camera.position.distanceTo(this.position);
		// Keep the beacon readable from afar without filling the screen up close
		const scale = Math.max(1, distance * 0.035);

		this._core.scale.setScalar(scale * (0.9 + Math.sin(elapsed * 4) * 0.1));
		this._core.material.opacity = this._intensity;

		this._rings.forEach((ring, index) => {
			const t = (((elapsed / SignalBeacon.PULSE_SECONDS + index / SignalBeacon.RING_COUNT) % 1) + 1) % 1;

			ring.quaternion.copy(camera.quaternion);
			ring.scale.setScalar(scale * (0.8 + t * 5));
			ring.material.opacity = (1 - t) * 0.8 * this._intensity;
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
