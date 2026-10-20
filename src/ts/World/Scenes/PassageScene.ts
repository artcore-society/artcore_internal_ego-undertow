import { CatmullRomCurve3, Vector3 } from 'three';
import DiveScene from './DiveScene.ts';
import Whale from '../Life/Whale.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { SCENES, canyonCentre, floorAt } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/** IV. The Whale Road: the canyon falls away into blue nothing. A humpback circles, then leads you down. */
export default class PassageScene extends DiveScene {
	/** The whale's way down, from the ledge to the temple: [z, y]. */
	private static readonly ROUTE: readonly (readonly [number, number])[] = [
		[-448, -52],
		[-480, -70],
		[-510, -94],
		[-540, -117],
		[-575, -136],
		[-612, -149],
		[-650, -154]
	];

	public readonly whale: Whale;
	public readonly route: readonly Vector3[];
	public readonly ledge: Vector3;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.PASSAGE], context, 53);

		this.route = PassageScene.ROUTE.map(([z, y]) => new Vector3(canyonCentre(z), y, z));
		this.ledge = this.ground(canyonCentre(-440), -440, 2.5);

		this.whale = this.own(
			new Whale(context.water, context.patches, new Vector3(canyonCentre(-480), -55, -480), 25, this.route)
		);
		this.whale.position.set(canyonCentre(-480) + 25, -55, -480);

		this.own(new JellyfishBloom(context.patches, this.drift(45), '#9d7bff'));
		this.own(new JellyfishBloom(context.patches, this.drift(35), '#5ff7ea'));
		this.rocks(26, 130, 2, 6, ['#3e4a52', '#46504f']);

		const curve = new CatmullRomCurve3([...this.route]);
		[0.15, 0.32, 0.5, 0.68, 0.84].forEach((t, index) => {
			this.shardSpots.push(curve.getPointAt(t).add(new Vector3(index % 2 ? 4 : -4, 2, 0)));
		});

		this.vent(
			this.ledge
				.clone()
				.setY(this.ledge.y - 2.5)
				.setX(this.ledge.x + 8),
			16
		);
		this.vent(this.ground(canyonCentre(-585) + 14, -585), 14);
	}

	public override update(frame: IFrameContext, diver: Vector3): void {
		this.whale.update(diver, frame.elapsed, frame.delta);
		this.updateVents(frame.elapsed);
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
