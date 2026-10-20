import {
	Color,
	CylinderGeometry,
	Euler,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	SphereGeometry,
	Vector3
} from 'three';
import DiveScene from './DiveScene.ts';
import KelpForest from '../Life/KelpForest.ts';
import SeaTurtle from '../Life/SeaTurtle.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { SCENES, SURFACE_Y } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * I. The reef: scanned brain, staghorn and cauliflower coral, soft coral and sea fans, anemones and
 * seaweed between mossy rock, turtles and bright schools, and Mara's old marker: a buoy at the
 * surface, its chain down to a transmitter blinking on the reef.
 */
export default class ReefScene extends DiveScene {
	/** The transmitter at the foot of the chain: the first stop. */
	public readonly marker: Vector3;

	private readonly _turtles: SeaTurtle[] = [];
	private readonly _beacon = new MeshBasicMaterial({ color: new Color('#ff4d3a') });
	private readonly _owned: { dispose(): void }[] = [];
	private _signal = 0;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.REEF], context, 11);

		this.marker = this.ground(this.centre.x - 6, this.centre.z - 85, 0.9);
		this.keepClear.push({ centre: this.marker, radius: 5 });

		// Museum scans are bleached skeletons: living colour comes from the instance tint
		this.instancedModel(
			'diploria_labyrinthiformis',
			this.placements(this.scatter(30, 95), 0.6, 1.7, ['#b9a25f', '#9cae6a', '#c48d62', '#a7b88a']),
			{
				size: 1.1,
				sink: 0.35,
				isObstacle: true
			}
		);
		this.instancedModel(
			'acropora_cervicornis_detail_view',
			this.placements(this.scatter(34, 95), 0.7, 1.5, ['#c98a5a', '#b39a5e', '#d4a07c', '#8fa06e']),
			{
				size: 1.6,
				sink: 0.08,
				isObstacle: true
			}
		);
		this.instancedModel(
			'pocillopora_damicornis_caespitosa',
			this.placements(this.scatter(14, 95), 0.7, 1.3, ['#e3a0b4', '#c9a26f', '#b7c38a']),
			{
				size: 0.9,
				sink: 0.25
			}
		);
		this.instancedModel('soft_coral_set', this.placements(this.scatter(10, 90), 0.8, 1.3), { size: 2.2, sink: 0.05 });
		this.instancedModel('fan_coral_cluster_low', this.placements(this.scatter(18, 95), 0.8, 1.5), {
			size: 1.6,
			sink: 0.05
		});
		this.instancedModel('blue_sea_anemone_l', this.placements(this.scatter(8, 90), 0.7, 1.2), { size: 1, sink: 0.2 });
		this.instancedModel('claret_tall_seaweed', this.placements(this.scatter(26, 95), 0.8, 1.4), {
			size: 2.2,
			sink: 0.02
		});
		this.instancedModel('claret_wiggle_seaweed', this.placements(this.scatter(26, 95), 0.7, 1.2), {
			size: 1.6,
			sink: 0.02
		});
		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(16, 100), 1.2, 3), {
			sink: 0.25,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(16, 100), 1.2, 3), {
			sink: 0.25,
			isObstacle: true
		});
		this.instancedModel('lambis_shell', this.placements(this.scatter(26, 90), 0.18, 0.3), { sink: 0.2 });

		this.own(
			new KelpForest(
				context.water,
				context.patches,
				this.scatter(20, 90, -0.2).map((position) => ({ position, scale: this.random.range(0.6, 1.1) })),
				7,
				3
			)
		);

		this.populate();
		this.buildMarker();
	}

	/** The transmitter switches to Mara's signal colour once you've listened. */
	public receiveSignal(): void {
		this._signal = 1;
	}

	public reset(): void {
		this._signal = 0;
	}

	public override update(frame: IFrameContext): void {
		const blink = Math.sin(frame.elapsed * 3) > 0.4 ? 5 : 0.25;

		this._beacon.color.set(this._signal ? '#5ef2e0' : '#ff4d3a').multiplyScalar(blink);
		this._turtles.forEach((turtle) => turtle.update(frame.elapsed, frame.delta));
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
	}

	private populate(): void {
		const palettes = [
			['#ffe08a', '#ffd23f'],
			['#7fb8ff', '#4f8cff'],
			['#ffb27a', '#ffffff'],
			['#ffffff', '#dfe8ea'],
			['#c8e6ff']
		];

		this.scatter(palettes.length, 75).forEach((spot, index) => {
			spot.y += this.random.range(2.5, 6);
			this.school(spot, {
				count: 35 + index * 10,
				radius: this.random.range(3.5, 7),
				height: 3,
				speed: this.random.range(0.22, 0.45),
				length: index === 3 ? 0.5 : 0.28,
				colors: palettes[index] ?? ['#ffffff'],
				seed: 100 + index
			});
		});

		this.predators(this.centre.clone().setY(this.centre.y + 9), 2, 30, 140);

		const clips = this.context.assets.animations('sea_turtle');

		for (let i = 0; i < 2; i++) {
			const turtle = this.own(
				new SeaTurtle(
					this.context.assets.model('sea_turtle'),
					clips,
					this.centre.clone().setY(this.centre.y + 4 + i * 2),
					18 + i * 12,
					0.07 - i * 0.02,
					i * 2.5,
					0
				)
			);
			this._turtles.push(turtle);
		}
	}

	/** Buoy at the surface, chain to the reef, transmitter at its foot. */
	private buildMarker(): void {
		const chainLength = SURFACE_Y - 1 - this.marker.y;
		const chain = new CylinderGeometry(0.035, 0.035, chainLength, 6);
		const steel = patchMaterial(
			new MeshStandardMaterial({ color: '#4b4f50', metalness: 0.8, roughness: 0.45 }),
			this.context.water.caustics
		);
		const lamp = new SphereGeometry(0.1, 12, 8);
		this._owned.push(chain, steel, lamp, this._beacon);

		const chainMesh = new Mesh(chain, steel);
		chainMesh.position.copy(this.marker).setY(this.marker.y + chainLength / 2);
		this.add(chainMesh);

		this.placeModel('ocean_buoy', this.marker.clone().setY(SURFACE_Y - 2.4), 3.2);
		this.placeModel(
			'vintage_radio_transceiver',
			this.marker.clone().setY(this.marker.y - 0.9),
			0.55,
			new Euler(0, 0.6, 0)
		);
		this.instancedModel('boulder_01', [{ position: this.marker.clone().setY(this.marker.y - 0.9), scale: 1 }], {
			size: 1.4,
			sink: 0.4
		});

		const lampMesh = new Mesh(lamp, this._beacon);
		lampMesh.position.copy(this.marker).setY(this.marker.y - 0.35);
		this.add(lampMesh);
	}
}
