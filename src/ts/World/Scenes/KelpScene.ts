import DiveScene from './DiveScene.ts';
import KelpForest from '../Life/KelpForest.ts';
import { SCENES, SURFACE_Y } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';

/** II. Kelp Cathedral: towering stalks with god rays falling between them, seaweed and anemones below. */
export default class KelpScene extends DiveScene {
	private static readonly HEIGHT = 20;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.KELP], context, 23);

		const stalks = this.scatter(260, 105, -0.3, 0.46).map((position) => ({
			position,
			// Reach for the light, but stay under the surface
			scale: Math.min((SURFACE_Y - 3 - position.y) / KelpScene.HEIGHT, this.random.range(0.65, 1.15))
		}));

		this.own(new KelpForest(context.water, context.patches, stalks, KelpScene.HEIGHT, 9));
		this.instancedModel('claret_tall_seaweed', this.placements(this.scatter(40, 100), 0.9, 1.6), {
			size: 2.4,
			sink: 0.02
		});
		this.instancedModel('claret_wiggle_seaweed', this.placements(this.scatter(40, 100), 0.8, 1.4), {
			size: 1.8,
			sink: 0.02
		});
		this.instancedModel('blue_sea_anemone_l', this.placements(this.scatter(6, 90), 0.8, 1.3), { size: 1, sink: 0.2 });
		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(18, 100), 1.5, 3.5), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(10, 100), 2, 4), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel('lambis_shell', this.placements(this.scatter(14, 90), 0.18, 0.3), { sink: 0.2 });

		this.scatter(5, 70).forEach((spot, index) => {
			spot.y += this.random.range(5, 14);
			this.school(spot, {
				count: index < 2 ? 140 : 80,
				radius: this.random.range(6, 11),
				height: 4,
				speed: 0.25,
				length: index < 2 ? 0.3 : 0.45,
				colors: ['#ffffff', '#dfe7ea'],
				seed: 200 + index
			});
		});

		this.predators(this.centre.clone().setY(this.centre.y + 9), 2, 34, 240);
	}

	/** Everything here moves on the GPU. */
	public override update(): void {
		// Nothing to advance on the CPU
	}
}
