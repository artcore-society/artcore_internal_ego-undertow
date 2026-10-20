import {
	BoxGeometry,
	Color,
	CylinderGeometry,
	Euler,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	Vector3,
	type BufferGeometry
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import DiveScene from './DiveScene.ts';
import BoxCollider from '../Colliders/BoxCollider.ts';
import ShelterZone from '../Colliders/ShelterZone.ts';
import { PropKind } from '../Props/PropFactory.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { SCENES } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

interface IPlate {
	readonly centre: readonly [number, number, number];
	readonly size: readonly [number, number, number];
}

/**
 * III. The Halcyon, Mara's research vessel, on its keel in the silt. The hull is open where the deck
 * collapsed and through a breach in the port side; her log glows in the deckhouse.
 */
export default class WreckScene extends DiveScene {
	private static readonly LENGTH = 32;
	private static readonly WIDTH = 8;
	private static readonly HEIGHT = 6;
	private static readonly YAW = 0.45;

	public readonly log: Vector3;

	private readonly _origin: Vector3;
	private readonly _up = new Vector3(0, 1, 0);
	private readonly _logMaterial: MeshBasicMaterial;
	private readonly _owned: (BufferGeometry | MeshLambertMaterial | MeshBasicMaterial)[] = [];

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.WRECK], context, 37);

		this._origin = this.ground(this.centre.x + 4, this.centre.z, -0.6);
		this._logMaterial = new MeshBasicMaterial({ color: new Color('#8ffcff').multiplyScalar(3) });

		const { LENGTH: L, WIDTH: W, HEIGHT: H } = WreckScene;
		const plates: IPlate[] = [
			{ centre: [0, 0.2, 0], size: [W, 0.4, L] },
			// Port side, breached between z 2..7
			{ centre: [-W / 2, H / 2, -7], size: [0.35, H, 18] },
			{ centre: [-W / 2, H / 2, 11.5], size: [0.35, H, 9] },
			{ centre: [-W / 2, H * 0.85, 4.5], size: [0.35, H * 0.3, 5] },
			{ centre: [W / 2, H / 2, 0], size: [0.35, H, L] },
			{ centre: [0, H / 2, -L / 2], size: [W, H, 0.35] },
			{ centre: [0, H / 2, L / 2], size: [W, H, 0.35] },
			// Deck, collapsed amidships
			{ centre: [0, H, -9], size: [W, 0.3, 14] },
			{ centre: [0, H, 10], size: [W, 0.3, 12] },
			// Deckhouse, with a doorway facing the bow
			{ centre: [0, H + 2.5, 15.5], size: [W - 1, 5, 0.3] },
			{ centre: [-(W / 2 - 0.5), H + 2.5, 11], size: [0.3, 5, 9] },
			{ centre: [W / 2 - 0.5, H + 2.5, 11], size: [0.3, 5, 9] },
			{ centre: [-2.6, H + 2.5, 6.5], size: [2, 5, 0.3] },
			{ centre: [2.6, H + 2.5, 6.5], size: [2, 5, 0.3] },
			{ centre: [0, H + 5, 11], size: [W - 1, 0.3, 9] },
			// Chart table
			{ centre: [0, H + 0.6, 13.4], size: [3, 1.2, 1.2] }
		];

		this.buildHull(plates);
		this.shelters.push(
			new ShelterZone(this.toWorld(0, H / 2, 0), new Vector3(W, H, L), WreckScene.YAW),
			new ShelterZone(this.toWorld(0, H + 2.5, 11), new Vector3(W - 1, 5, 9), WreckScene.YAW)
		);
		this.buildRigging();

		this.log = this.toWorld(0, H + 1.45, 13.4);
		const tablet = new BoxGeometry(0.7, 0.08, 0.5);
		this._owned.push(tablet, this._logMaterial);
		const logMesh = new Mesh(tablet, this._logMaterial);
		logMesh.position.copy(this.log);
		logMesh.rotation.y = WreckScene.YAW;
		this.add(logMesh);

		this.add(
			context.props.instanced(
				PropKind.ANEMONE,
				[...Array(18).keys()].map((index) => ({
					position: this.toWorld(
						this.random.range(-3, 3),
						H + 0.15,
						index < 9 ? this.random.range(-15, -3) : this.random.range(5, 6)
					),
					scale: this.random.range(0.5, 1),
					color: index % 2 ? '#ffcf7f' : '#ff9fd2'
				})),
				'#ff9fd2'
			)
		);
		this.rocks(30, 80, 1, 4.5, ['#4f5552', '#5b5a52']);

		const school = this.toWorld(0, H + 6, -4);
		this.school(school, {
			count: 26,
			radius: 11,
			height: 3,
			speed: 0.14,
			scale: 1.5,
			colors: ['#8a9aa3', '#b4c0c6'],
			seed: 301
		});

		this.shardSpots.push(
			this.toWorld(0, 2, -8),
			this.toWorld(0, 2, 11),
			this.toWorld(-2, H + 1.6, 10),
			this.toWorld(-7, 3, 4.5)
		);
		this.vent(this.toWorld(1.5, H + 0.2, 9.5), 4.4);
		this.vent(this.ground(this.centre.x - 18, this.centre.z - 20), 22);
	}

	/** Breach in the port side, the way in for the story. */
	public get breach(): Vector3 {
		return this.toWorld(-WreckScene.WIDTH / 2 - 3, 2.5, 4.5);
	}

	public override update(frame: IFrameContext): void {
		this._logMaterial.color.setRGB(0.55, 0.99, 1).multiplyScalar(2.2 + Math.sin(frame.elapsed * 2.4) * 1.2);
		this.updateVents(frame.elapsed);
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
	}

	private toWorld(x: number, y: number, z: number): Vector3 {
		return new Vector3(x, y, z).applyAxisAngle(this._up, WreckScene.YAW).add(this._origin);
	}

	/** All plates merged into one mesh (one draw call), each with its own collider. */
	private buildHull(plates: readonly IPlate[]): void {
		const matrix = new Matrix4();
		const parts = plates.map(({ centre, size }) => {
			const [x, y, z] = centre;
			const [sx, sy, sz] = size;

			this.colliders.push(new BoxCollider(this.toWorld(x, y, z), new Vector3(sx, sy, sz), WreckScene.YAW));

			return new BoxGeometry(sx, sy, sz).applyMatrix4(matrix.makeTranslation(x, y, z));
		});

		const hull = mergeGeometries(parts);
		parts.forEach((part) => part.dispose());

		if (!hull) {
			return;
		}

		const rust = patchMaterial(new MeshLambertMaterial({ color: '#6d4c3a' }), this.context.water.caustics);
		this._owned.push(hull, rust);

		const mesh = new Mesh(hull, rust);
		mesh.position.copy(this._origin);
		mesh.rotation.y = WreckScene.YAW;
		this.add(mesh);
	}

	/** The broken mast lying across the bow deck. */
	private buildRigging(): void {
		const mast = new CylinderGeometry(0.22, 0.28, 14, 8);
		const wood = patchMaterial(new MeshLambertMaterial({ color: '#4a3a2c' }), this.context.water.caustics);
		this._owned.push(mast, wood);

		const mesh = new Mesh(mast, wood);
		mesh.position.copy(this.toWorld(1.5, WreckScene.HEIGHT + 2.2, -9));
		mesh.rotation.copy(new Euler(1.25, WreckScene.YAW + 0.3, 0.2, 'YXZ'));
		this.add(mesh);
	}
}
