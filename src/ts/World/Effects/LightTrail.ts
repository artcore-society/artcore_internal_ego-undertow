import {
	AdditiveBlending,
	CanvasTexture,
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
import type IDisposable from '../../Contracts/IDisposable.ts';

export interface ITrailSpot {
	readonly position: Vector3;
	/** Where along the journey (0..1) this light hangs. */
	readonly progress: number;
}

/**
 * Mara's trail: small shards of light hanging along the way down. They stay hidden until she tells
 * you to follow the light; after that each one blooms into view, in turn, as it comes up ahead.
 * Swimming through one gathers it (it flares and fades). One instanced draw for the crystals, one
 * point draw for their halos.
 */
export default class LightTrail extends Group implements IDisposable {
	private static readonly GATHER_RADIUS = 3.2;
	private static readonly FADE_SECONDS = 0.8;
	/** How far ahead (in journey progress) a light appears. */
	private static readonly LOOKAHEAD = 0.035;
	private static readonly APPEAR_SECONDS = 0.9;

	private readonly _spots: readonly ITrailSpot[];
	private readonly _gatheredAt: number[];
	private readonly _appearedAt: number[];
	private _revealFrom = Infinity;
	private readonly _crystals: InstancedMesh<OctahedronGeometry, MeshBasicMaterial>;
	private readonly _halos: Points<BufferGeometry, PointsMaterial>;
	private readonly _haloPositions: Float32Array;
	private readonly _matrix = new Matrix4();
	private readonly _rotation = new Quaternion();
	private readonly _scale = new Vector3();
	private readonly _position = new Vector3();
	private readonly _axis = new Vector3(0, 1, 0);
	private _listener: ((count: number) => void) | null = null;
	private _gathered = 0;

	constructor(spots: readonly ITrailSpot[]) {
		super();

		this._spots = spots;
		this._gatheredAt = spots.map(() => -1);
		this._appearedAt = spots.map(() => -1);
		this._crystals = new InstancedMesh(
			new OctahedronGeometry(0.16, 0),
			new MeshBasicMaterial({ color: new Color('#bffff6').multiplyScalar(1.8) }),
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
				color: new Color('#5ff7ea'),
				map: LightTrail.glow(),
				size: 0.9,
				transparent: true,
				opacity: 0.22,
				depthWrite: false,
				blending: AdditiveBlending
			})
		);
		this._halos.frustumCulled = false;

		this.add(this._crystals, this._halos);
	}

	public get gathered(): number {
		return this._gathered;
	}

	public onGather(listener: (count: number) => void): void {
		this._listener = listener;
	}

	public reset(): void {
		this._gatheredAt.fill(-1);
		this._appearedAt.fill(-1);
		this._revealFrom = Infinity;
		this._gathered = 0;
	}

	/** From now on, lights ahead may appear. */
	public reveal(progress: number): void {
		this._revealFrom = Math.min(this._revealFrom, progress);
	}

	public update(camera: Vector3, progress: number, elapsed: number): void {
		this._spots.forEach((spot, index) => {
			const gatheredAt = this._gatheredAt[index] ?? -1;
			const isDue = spot.progress >= this._revealFrom && spot.progress - progress < LightTrail.LOOKAHEAD;

			if (isDue && (this._appearedAt[index] ?? -1) < 0) {
				this._appearedAt[index] = elapsed;
			}

			const appearedAt = this._appearedAt[index] ?? -1;

			if (appearedAt >= 0 && gatheredAt < 0 && spot.position.distanceTo(camera) < LightTrail.GATHER_RADIUS) {
				this._gatheredAt[index] = elapsed;
				this._gathered++;
				this._listener?.(this._gathered);
			}

			const grow =
				appearedAt < 0 ? 0 : LightTrail.easeOutBack(Math.min(1, (elapsed - appearedAt) / LightTrail.APPEAR_SECONDS));
			this.place(index, spot.position, elapsed, gatheredAt < 0 ? -1 : elapsed - gatheredAt, grow);
		});

		this._crystals.instanceMatrix.needsUpdate = true;
		this._halos.geometry.getAttribute('position').needsUpdate = true;
	}

	/** A soft round sprite; without one, points draw as squares. */
	private static glow(): CanvasTexture {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		const context = canvas.getContext('2d');

		if (context) {
			const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
			gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
			gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.45)');
			gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
			context.fillStyle = gradient;
			context.fillRect(0, 0, 64, 64);
		}

		return new CanvasTexture(canvas);
	}

	public override dispose(): void {
		this._halos.material.map?.dispose();
		this._crystals.geometry.dispose();
		this._crystals.material.dispose();
		this._crystals.dispose();
		this._halos.geometry.dispose();
		this._halos.material.dispose();
		super.dispose();
	}

	private static easeOutBack(t: number): number {
		const overshoot = 1.7;

		return 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
	}

	/**
	 * @param sinceGathered seconds since gathered, or -1 while still waiting
	 * @param grow 0..1 how far it has bloomed into view
	 */
	private place(index: number, spot: Vector3, elapsed: number, sinceGathered: number, grow: number): void {
		const fade = (sinceGathered < 0 ? 1 : Math.max(0, 1 - sinceGathered / LightTrail.FADE_SECONDS)) * grow;
		const flare = sinceGathered < 0 ? 1 : 1 + sinceGathered * 3;

		this._position.copy(spot);
		this._position.y += Math.sin(elapsed * 1.3 + index) * 0.2 + (sinceGathered > 0 ? sinceGathered * 2 : 0);
		this._rotation.setFromAxisAngle(this._axis, elapsed * 1.1 + index);
		this._scale.setScalar(fade * flare);
		this._matrix.compose(this._position, this._rotation, this._scale);
		this._crystals.setMatrixAt(index, this._matrix);

		// Gathered halos are parked far below the world
		this._haloPositions[index * 3] = this._position.x;
		this._haloPositions[index * 3 + 1] = fade > 0.01 ? this._position.y : -10000;
		this._haloPositions[index * 3 + 2] = this._position.z;
	}
}
