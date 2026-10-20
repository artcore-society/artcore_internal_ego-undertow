import {
	BoxGeometry,
	Group,
	Mesh,
	MeshLambertMaterial,
	SphereGeometry,
	type BufferGeometry,
	type Vector3
} from 'three';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/** A sea turtle gliding a lazy loop over the reef. */
export default class Turtle extends Group implements IDisposable {
	private readonly _centre: Vector3;
	private readonly _radius: number;
	private readonly _speed: number;
	private readonly _phase: number;
	private readonly _flippers: Mesh[] = [];
	private readonly _geometries: BufferGeometry[] = [];
	private readonly _materials: MeshLambertMaterial[] = [];

	constructor(water: WaterUniforms, centre: Vector3, radius: number, speed: number, phase: number) {
		super();

		this._centre = centre.clone();
		this._radius = radius;
		this._speed = speed;
		this._phase = phase;

		const shell = patchMaterial(new MeshLambertMaterial({ color: '#6b5a33' }), water.caustics);
		const skin = patchMaterial(new MeshLambertMaterial({ color: '#8f9a6a' }), water.caustics);
		this._materials.push(shell, skin);

		const shellGeometry = new SphereGeometry(0.6, 12, 8).scale(1, 0.38, 1.25);
		const headGeometry = new SphereGeometry(0.2, 8, 6).scale(1, 0.85, 1.3);
		const flipperGeometry = new BoxGeometry(0.75, 0.05, 0.28).translate(0.38, 0, 0);
		this._geometries.push(shellGeometry, headGeometry, flipperGeometry);

		this.add(new Mesh(shellGeometry, shell));

		const head = new Mesh(headGeometry, skin);
		head.position.set(0, 0.02, -0.85);
		this.add(head);

		const mounts: [number, number, number][] = [
			[0.42, -0.35, 1],
			[-0.42, -0.35, -1],
			[0.32, 0.5, 0.6],
			[-0.32, 0.5, -0.6]
		];

		mounts.forEach(([x, z, side]) => {
			const flipper = new Mesh(flipperGeometry, skin);
			flipper.position.set(x, -0.05, z);
			flipper.scale.set(Math.abs(side), 1, 1);
			flipper.rotation.y = side > 0 ? -0.4 : Math.PI + 0.4;
			this._flippers.push(flipper);
			this.add(flipper);
		});
	}

	public update(elapsed: number): void {
		const angle = this._phase + elapsed * this._speed;

		this.position.set(
			this._centre.x + Math.cos(angle) * this._radius,
			this._centre.y + Math.sin(angle * 0.7) * 1.5,
			this._centre.z + Math.sin(angle) * this._radius
		);
		// Face along the loop's tangent (model forward is -Z)
		this.rotation.y = Math.PI - angle;
		this.rotation.z = Math.sin(elapsed * 0.6) * 0.08;

		const stroke = Math.sin(elapsed * 1.6 + this._phase);
		this._flippers.forEach((flipper, index) => {
			flipper.rotation.z = stroke * (index < 2 ? 0.55 : 0.25) * (index % 2 === 0 ? 1 : -1);
		});
	}

	public override dispose(): void {
		this._geometries.forEach((geometry) => geometry.dispose());
		this._materials.forEach((material) => material.dispose());
		super.dispose();
	}
}
