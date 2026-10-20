import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	DynamicDrawUsage,
	Group,
	InstancedMesh,
	Matrix4,
	MeshBasicMaterial,
	OctahedronGeometry,
	Points,
	PointsMaterial,
	Quaternion,
	Vector3
} from 'three';
import type { SceneId } from '../../Enums/SceneId.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

export interface IShardSpot {
	readonly scene: SceneId;
	readonly position: Vector3;
}

type CollectListener = (spot: IShardSpot) => void;

/**
 * Mara's light shards. One instanced draw for the crystals and one point draw for their halos,
 * whatever the number of shards. Only shards of active scenes animate and can be collected.
 */
export default class ShardField extends Group implements IDisposable {
	private static readonly PICKUP_RADIUS = 2.2;

	private readonly _spots: readonly IShardSpot[];
	private readonly _collected: boolean[];
	private readonly _active = new Set<SceneId>();
	private readonly _crystals: InstancedMesh<OctahedronGeometry, MeshBasicMaterial>;
	private readonly _halos: Points<BufferGeometry, PointsMaterial>;
	private readonly _haloPositions: Float32Array;
	private readonly _matrix = new Matrix4();
	private readonly _rotation = new Quaternion();
	private readonly _scale = new Vector3();
	private readonly _position = new Vector3();
	private readonly _axis = new Vector3(0, 1, 0);
	private _listener: CollectListener | null = null;

	constructor(spots: readonly IShardSpot[]) {
		super();

		this._spots = spots;
		this._collected = spots.map(() => false);
		this._crystals = new InstancedMesh(
			new OctahedronGeometry(0.42, 0),
			new MeshBasicMaterial({ color: new Color('#9ffff4').multiplyScalar(3.2) }),
			spots.length
		);
		this._crystals.instanceMatrix.setUsage(DynamicDrawUsage);
		this._crystals.frustumCulled = false;

		this._haloPositions = new Float32Array(spots.length * 3);
		const haloGeometry = new BufferGeometry();
		haloGeometry.setAttribute('position', new BufferAttribute(this._haloPositions, 3).setUsage(DynamicDrawUsage));
		this._halos = new Points(
			haloGeometry,
			new PointsMaterial({
				color: new Color('#5ff7ea').multiplyScalar(0.9),
				size: 3.2,
				transparent: true,
				opacity: 0.4,
				depthWrite: false,
				blending: AdditiveBlending
			})
		);
		this._halos.frustumCulled = false;

		this.add(this._crystals, this._halos);
		this.hideAll();
	}

	public get remaining(): number {
		return this._spots.filter((spot, index) => this._active.has(spot.scene) && !this._collected[index]).length;
	}

	public onCollect(listener: CollectListener): void {
		this._listener = listener;
	}

	public activate(scene: SceneId): void {
		this._active.add(scene);
	}

	/** Puts every shard back and deactivates all scenes, e.g. for a new dive. */
	public reset(): void {
		this._collected.fill(false);
		this._active.clear();
		this.hideAll();
	}

	/** Free dive: every shard everywhere. */
	public activateAll(): void {
		this._spots.forEach((spot) => this._active.add(spot.scene));
	}

	public update(diver: Vector3, elapsed: number): void {
		this._spots.forEach((spot, index) => {
			const visible = this._active.has(spot.scene) && !this._collected[index];

			if (visible && spot.position.distanceTo(diver) < ShardField.PICKUP_RADIUS) {
				this._collected[index] = true;
				this._listener?.(spot);
			}

			this.place(index, visible && !this._collected[index], elapsed);
		});

		this._crystals.instanceMatrix.needsUpdate = true;
		this._halos.geometry.getAttribute('position').needsUpdate = true;
	}

	public override dispose(): void {
		this._crystals.geometry.dispose();
		this._crystals.material.dispose();
		this._crystals.dispose();
		this._halos.geometry.dispose();
		this._halos.material.dispose();
		super.dispose();
	}

	private place(index: number, visible: boolean, elapsed: number): void {
		const spot = this._spots[index];

		if (!spot) {
			return;
		}

		this._position.copy(spot.position);
		this._position.y += Math.sin(elapsed * 1.4 + index) * 0.25;
		this._rotation.setFromAxisAngle(this._axis, elapsed * 1.2 + index);
		this._scale.setScalar(visible ? 1 : 0);
		this._matrix.compose(this._position, this._rotation, this._scale);
		this._crystals.setMatrixAt(index, this._matrix);

		// Hidden halos are parked far below the world
		this._haloPositions[index * 3] = this._position.x;
		this._haloPositions[index * 3 + 1] = visible ? this._position.y : -10000;
		this._haloPositions[index * 3 + 2] = this._position.z;
	}

	private hideAll(): void {
		this._spots.forEach((_spot, index) => this.place(index, false, 0));
		this._crystals.instanceMatrix.needsUpdate = true;
	}
}
