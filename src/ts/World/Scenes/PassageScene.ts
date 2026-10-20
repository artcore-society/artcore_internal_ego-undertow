import { Vector3 } from 'three';
import DiveScene from './DiveScene.ts';
import Whale from '../Life/Whale.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { SCENES, canyonCentre, floorAt } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/** IV. The Whale Road: the canyon falls away into blue nothing. A humpback circles, then leads the way down. */
export default class PassageScene extends DiveScene {
	/** The whale's way down, from the ledge to the temple: [z, y]. */
	private static readonly ROUTE: readonly (readonly [number, number])[] = [
		[-462, -60],
		[-495, -78],
		[-525, -100],
		[-555, -120],
		[-590, -138],
		[-625, -150],
		[-660, -156]
	];

	public readonly whale: Whale;
	public readonly route: readonly Vector3[];
	public readonly ledge: Vector3;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.PASSAGE], context, 53);

		this.route = PassageScene.ROUTE.map(([z, y]) => new Vector3(canyonCentre(z), y, z));
		this.ledge = this.ground(canyonCentre(-440), -440, 3);

		const [whale] = context.assets.parts('humpback_whale');

		if (!whale) {
			throw new Error('The whale model has no mesh');
		}

		this.whale = this.own(
			new Whale(context.water, context.patches, whale, new Vector3(canyonCentre(-490), -58, -490), 24, this.route)
		);

		this.own(new JellyfishBloom(context.water, this.drift(40), '#9d7bff', 61));
		this.own(new JellyfishBloom(context.water, this.drift(30), '#5ff7ea', 62));
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(14, 130, 0, 0.5), 2.5, 6), {
			sink: 0.35,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(18, 130, 0, 0.5), 2, 4), {
			sink: 0.35,
			isObstacle: true
		});

		this.lanternfish(new Vector3(canyonCentre(-520) - 12, -95, -520), 140, '#5ef2e0', 501);
		this.lanternfish(new Vector3(canyonCentre(-600) + 10, -135, -600), 140, '#9d7bff', 502);
		this.predators(new Vector3(canyonCentre(-470), -70, -470), 2, 40, 503);
	}

	public override update(frame: IFrameContext): void {
		this.whale.update(frame.elapsed, frame.delta);
	}

	/** Points hanging in the open water of the drop. */
	private drift(count: number): Vector3[] {
		return [...Array(count).keys()].map(() => {
			const z = this.random.range(-450, -650);
			const floor = floorAt(z);

			return new Vector3(
				canyonCentre(z) + this.random.range(-30, 30),
				this.random.range(floor + 6, Math.min(-40, floor + 70)),
				z
			);
		});
	}
}
