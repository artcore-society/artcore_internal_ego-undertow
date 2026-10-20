import DiveScene from './DiveScene.ts';
import KelpForest from '../Life/KelpForest.ts';
import { PropKind } from '../Props/PropFactory.ts';
import { SCENES, SURFACE_Y } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/** II. Kelp Cathedral: tall swaying stalks, god rays falling between them, silver schools. */
export default class KelpScene extends DiveScene {
	constructor(context: ISceneContext) {
		super(SCENES[SceneId.KELP], context, 23);

		const stalks = this.scatter(420, 105, -0.3, 0.46).map((position) => ({
			position,
			// Reach for the light, but stay under the surface
			height: Math.min(SURFACE_Y - 4 - position.y, this.random.range(12, 26))
		}));

		this.own(new KelpForest(context.water, context.patches, stalks, 9));
		this.rocks(40, 100, 1, 5, ['#5f6763', '#6f6a5c']);
		this.add(
			context.props.instanced(
				PropKind.ANEMONE,
				this.placements(this.scatter(40, 90), 0.6, 1.2, ['#ffb3c7', '#f6e27f']),
				'#ffb3c7'
			)
		);

		this.scatter(3, 70).forEach((spot, index) => {
			spot.y += this.random.range(5, 10);
			this.school(spot, {
				count: 110,
				radius: this.random.range(6, 10),
				height: 4,
				speed: 0.3,
				scale: 0.5,
				colors: ['#c9d6dc', '#9fb3bd', '#e4ecef'],
				seed: 200 + index
			});
		});

		// Mara's trail of light, woven between the stalks
		this.shardSpots.push(...this.scatter(6, 85, 0, 0.35).map((spot) => spot.setY(spot.y + this.random.range(3, 8))));
		this.vent(this.ground(this.centre.x - 14, this.centre.z + 20), 18);
	}

	public override update(frame: IFrameContext): void {
		this.updateVents(frame.elapsed);
	}
}
