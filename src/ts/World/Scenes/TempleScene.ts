import {
	BoxGeometry,
	Color,
	Euler,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	SphereGeometry,
	Vector3,
	type BufferGeometry
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import DiveScene from './DiveScene.ts';
import BoxCollider from '../Colliders/BoxCollider.ts';
import ColumnCollider from '../Colliders/ColumnCollider.ts';
import ShelterZone from '../Colliders/ShelterZone.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { PropKind, type IPropPlacement } from '../Props/PropFactory.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import { SCENES } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

type Block = readonly [x: number, y: number, z: number, width: number, height: number, depth: number];

/**
 * V. The Drowned Temple: a colonnade on a stepped platform, an inner sanctum with an altar,
 * and two stone guardians at the steps whose eyes open when the diver comes near the altar.
 */
export default class TempleScene extends DiveScene {
	private static readonly TOP = 3;
	private static readonly COLUMN_HEIGHT = 13;

	public readonly altar: Vector3;
	public readonly entrance: Vector3;

	private readonly _origin: Vector3;
	private readonly _eyes: MeshBasicMaterial;
	private readonly _socket: MeshBasicMaterial;
	private readonly _owned: (BufferGeometry | MeshLambertMaterial | MeshBasicMaterial)[] = [];
	private _wake = 0;
	private _wakeTarget = 0;
	private _socketLit = 0;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.TEMPLE], context, 71);

		this._origin = this.ground(this.centre.x, this.centre.z, -0.5);
		this._eyes = new MeshBasicMaterial({ color: new Color('#ff5a3c') });
		this._socket = new MeshBasicMaterial({ color: new Color('#8ffcff') });
		this._owned.push(this._eyes, this._socket);

		const top = TempleScene.TOP;
		const blocks: Block[] = [
			// Stepped platform
			[0, 0.75, 0, 40, 1.5, 56],
			[0, 2.25, 0, 34, 1.5, 50],
			// Sanctum, door facing +Z
			[0, top + 5, -16, 11, 10, 0.6],
			[-5.5, top + 5, -9, 0.6, 10, 14],
			[5.5, top + 5, -9, 0.6, 10, 14],
			[-3.75, top + 5, -2, 3.5, 10, 0.6],
			[3.75, top + 5, -2, 3.5, 10, 0.6],
			[0, top + 8.5, -2, 4, 3, 0.6],
			[0, top + 10.3, -9, 12, 0.6, 15],
			// Altar
			[0, top + 0.7, -12, 2.4, 1.4, 1.6],
			// Entablature over the front colonnade
			[-9, top + TempleScene.COLUMN_HEIGHT + 0.6, 11.25, 2, 1.2, 15],
			[9, top + TempleScene.COLUMN_HEIGHT + 0.6, 11.25, 2, 1.2, 15],
			[0, top + TempleScene.COLUMN_HEIGHT + 0.6, 18.5, 20, 1.2, 2]
		];

		this.add(this.merge(blocks, '#7f857b', true));
		this.shelters.push(new ShelterZone(this.toWorld(0, top + 5, -9), new Vector3(11, 10, 14)));
		this.buildColonnade();
		this.buildGuardian(-13.5);
		this.buildGuardian(13.5);

		this.altar = this.toWorld(0, top + 1.9, -12);
		this.entrance = this.toWorld(0, 6, 34);

		const socket = new SphereGeometry(0.45, 14, 10);
		this._owned.push(socket);
		const socketMesh = new Mesh(socket, this._socket);
		socketMesh.position.copy(this.altar);
		this.add(socketMesh);

		this.own(new JellyfishBloom(context.patches, this.halo(24), '#5ff7ea'));
		this.rocks(30, 100, 2, 6, ['#3a4448', '#444c4b']);

		this.shardSpots.push(
			this.toWorld(0, top + 2.5, 14),
			this.toWorld(-13, top + 2, 0),
			this.toWorld(13, top + 2, -8),
			this.toWorld(0, top + 2, 26)
		);
		this.vent(this.ground(this._origin.x - 25, this._origin.z + 6), 15);
		this.vent(this.toWorld(3.5, top, -6), 6);
	}

	/** Opens the guardians' eyes. */
	public wake(): void {
		this._wakeTarget = 1;
	}

	/** Mara's light settles in the altar. */
	public lightAltar(): void {
		this._socketLit = 1;
	}

	public reset(): void {
		this._wake = 0;
		this._wakeTarget = 0;
		this._socketLit = 0;
	}

	public override update(frame: IFrameContext): void {
		this._wake = damp(this._wake, this._wakeTarget, 0.8, frame.delta);
		this._eyes.color
			.setRGB(1, 0.35, 0.24)
			.multiplyScalar(0.05 + this._wake * (5 + Math.sin(frame.elapsed * 1.5) * 1.5));
		this._socket.color
			.setRGB(0.56, 0.99, 1)
			.multiplyScalar(0.15 + this._socketLit * (3.5 + Math.sin(frame.elapsed * 3) * 0.8));
		this.updateVents(frame.elapsed);
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
	}

	private toWorld(x: number, y: number, z: number): Vector3 {
		return new Vector3(x, y, z).add(this._origin);
	}

	/** Boxes merged into one mesh; optionally each gets a collider. */
	private merge(blocks: readonly Block[], color: string, collide: boolean): Mesh {
		const matrix = new Matrix4();
		const parts = blocks.map(([x, y, z, width, height, depth]) => {
			if (collide) {
				this.colliders.push(new BoxCollider(this.toWorld(x, y, z), new Vector3(width, height, depth), 0));
			}

			return new BoxGeometry(width, height, depth).applyMatrix4(matrix.makeTranslation(x, y, z));
		});

		const geometry = mergeGeometries(parts) ?? new BoxGeometry();
		parts.forEach((part) => part.dispose());

		const material = patchMaterial(new MeshLambertMaterial({ color }), this.context.water.caustics);
		this._owned.push(geometry, material);

		const mesh = new Mesh(geometry, material);
		mesh.position.copy(this._origin);

		return mesh;
	}

	private buildColonnade(): void {
		const standing: IPropPlacement[] = [];
		const fallen: IPropPlacement[] = [];
		const top = TempleScene.TOP;

		[-9, 9].forEach((x) => {
			for (let i = 0; i < 9; i++) {
				const z = -18 + i * 4.5;
				const isBroken = (i === 2 && x < 0) || (i === 5 && x > 0) || (i === 1 && x > 0);
				const height = isBroken ? this.random.range(4, 8) : TempleScene.COLUMN_HEIGHT;

				standing.push({ position: this.toWorld(x, top, z), scale: new Vector3(1.6, height, 1.6) });
				this.colliders.push(
					new ColumnCollider(this._origin.x + x, this._origin.z + z, 0.8, this._origin.y, this._origin.y + top + height)
				);

				if (isBroken) {
					fallen.push({
						position: this.toWorld(x + (x > 0 ? 3 : -3), top + 0.7, z + 2),
						scale: new Vector3(1.5, TempleScene.COLUMN_HEIGHT - height, 1.5),
						rotation: new Euler(Math.PI / 2, 0, x > 0 ? -0.5 : 0.5)
					});
				}
			}
		});

		this.add(
			this.context.props.instanced(PropKind.COLUMN, standing, '#8a9086'),
			this.context.props.instanced(PropKind.COLUMN, fallen, '#7d837a')
		);
	}

	/** A seated-looking stone giant: legs, torso, arms, head, two eyes. */
	private buildGuardian(x: number): void {
		const z = 22;
		const top = TempleScene.TOP;
		const blocks: Block[] = [
			[x, top + 2.5, z, 3, 5, 2.2],
			[x, top + 7.5, z, 3.8, 5, 2.6],
			[x - 2.4, top + 6.5, z, 1, 5.5, 1.1],
			[x + 2.4, top + 6.5, z, 1, 5.5, 1.1],
			[x, top + 11.2, z, 2.4, 2.4, 2.4]
		];

		this.add(this.merge(blocks, '#66706a', false));
		this.colliders.push(
			new ColumnCollider(this._origin.x + x, this._origin.z + z, 2.6, this._origin.y, this._origin.y + top + 12.4)
		);

		const eye = new SphereGeometry(0.22, 8, 6);
		this._owned.push(eye);

		[-0.55, 0.55].forEach((offset) => {
			const mesh = new Mesh(eye, this._eyes);
			mesh.position.copy(this.toWorld(x + offset, top + 11.5, z + 1.22));
			this.add(mesh);
		});
	}

	private halo(count: number): Vector3[] {
		return [...Array(count).keys()].map(() =>
			this.toWorld(this.random.range(-35, 35), this.random.range(8, 26), this.random.range(-40, 40))
		);
	}
}
