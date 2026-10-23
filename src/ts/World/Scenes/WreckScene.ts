import { Color, Euler, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import DiveScene from './DiveScene.ts';
import { SCENES } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * III. An old galleon Mara studied for years, rolled onto its side in the silt, sails long gone.
 * Her recorder lies in the sand by the hull, still blinking.
 */
export default class WreckScene extends DiveScene {
	private static readonly YAW = 0.45;
	private static readonly ROLL = 0.55;

	/** Where the hull rests. */
	public readonly origin: Vector3;
	/** Mara's recorder: the second stop. */
	public readonly recorder: Vector3;

	private readonly _lamp: MeshBasicMaterial;
	private readonly _lampGeometry = new SphereGeometry(0.06, 10, 8);
	private readonly _up = new Vector3(0, 1, 0);

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.WRECK], context, 37);

		this.origin = this.ground(this.centre.x + 4, this.centre.z);
		// The hull lies across these circles: nothing may be scattered inside it
		[-12, -4, 4, 12].forEach((along) => {
			const [x, z] = this.local(0, along);
			this.keepClear.push({ centre: new Vector3(x, this.origin.y, z), radius: 9 });
		});
		this.buildShip();

		this.recorder = this.ground(...this.local(-9, 6), 0.05);
		this.placeModel('vintage_radio_transceiver', this.recorder, 0.6, new Euler(0, 1.1, 0.12));
		this._lamp = new MeshBasicMaterial({ color: new Color('#5ef2e0') });

		const lamp = new Mesh(this._lampGeometry, this._lamp);
		lamp.position.copy(this.recorder).add(new Vector3(0.12, 0.38, 0.05));
		this.add(lamp);

		[
			[-12, -8, 0.3],
			[11, 13, 2.1],
			[-14, 18, 4.2]
		].forEach(([x, z, yaw]) => {
			this.placeModel(
				'cannon_01',
				this.ground(...this.local(x ?? 0, z ?? 0), -0.25),
				2.6,
				new Euler(0.05, yaw ?? 0, 0.18)
			);
		});

		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(16, 80), 1.5, 4), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(6, 80), 2.5, 4.5), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel(
			'acropora_cervicornis_detail_view',
			this.placements(this.scatter(10, 70), 0.6, 1.2, ['#9a8a62', '#7f8c66']),
			{
				size: 1.4,
				sink: 0.08
			}
		);
		this.instancedModel('fan_coral_cluster_low', this.placements(this.scatter(10, 70), 0.8, 1.3), {
			size: 1.4,
			sink: 0.05
		});
		this.instancedModel('lambis_shell', this.placements(this.scatter(14, 60), 0.18, 0.3), { sink: 0.2 });

		this.school(this.origin.clone().add(new Vector3(0, 8, -4)), {
			count: 40,
			radius: 12,
			height: 3,
			speed: 0.14,
			length: 0.9,
			colors: ['#b8c2c6', '#e2e8ea'],
			seed: 301
		});

		this.school(this.origin.clone().add(new Vector3(-10, 14, 12)), {
			count: 80,
			radius: 9,
			height: 4,
			speed: 0.2,
			length: 0.4,
			colors: ['#9fb3bb', '#c7d3d8'],
			seed: 302
		});
		// Something big circles the wreck
		this.predators(this.origin.clone().add(new Vector3(0, 10, 0)), 3, 22, 303);
	}

	public override update(frame: IFrameContext): void {
		this._lamp.color.setRGB(0.37, 0.95, 0.88).multiplyScalar(Math.sin(frame.elapsed * 2.6) > 0.2 ? 5 : 0.3);
	}

	public override dispose(): void {
		super.dispose();
		this._lamp.dispose();
		this._lampGeometry.dispose();
	}

	/** A point in the wreck's frame (x across, z along the hull) to world x/z. */
	private local(x: number, z: number): [number, number] {
		const point = new Vector3(x, 0, z).applyAxisAngle(this._up, WreckScene.YAW);

		return [this.origin.x + point.x, this.origin.z + point.z];
	}

	/** The galleon (authored 30 m long, keel along Z): rolled onto its side, turned and sunk into the silt. */
	private buildShip(): void {
		const ship = this.context.assets.model('dutch_ship_medium');

		ship.position.copy(this.origin).setY(this.origin.y - 2.2);
		ship.rotation.set(0, WreckScene.YAW, -WreckScene.ROLL, 'YXZ');
		this.add(ship);
	}
}
