import {
	BoxGeometry,
	Color,
	CylinderGeometry,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	SphereGeometry,
	Vector3
} from 'three';
import DiveScene from './DiveScene.ts';
import KelpForest from '../Life/KelpForest.ts';
import Turtle from '../Life/Turtle.ts';
import { PropKind } from '../Props/PropFactory.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { SCENES } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/** I. Sunlit shallows: coral, turtles, bright fish, and Mara's old dive marker blinking at the far edge. */
export default class ReefScene extends DiveScene {
	public readonly marker: Vector3;

	private readonly _turtles: Turtle[] = [];
	private readonly _beaconMaterial: MeshBasicMaterial;
	private readonly _markerParts: (
		BoxGeometry | CylinderGeometry | SphereGeometry | MeshLambertMaterial | MeshBasicMaterial
	)[] = [];

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.REEF], context, 11);

		const { props } = context;
		const coralColors = ['#ff7a59', '#ff9fb2', '#c86bfa', '#ffb84d', '#ff5e7e'];

		this.add(
			props.instanced(
				PropKind.BRAIN_CORAL,
				this.placements(this.scatter(70, 95, -0.3), 0.6, 1.8, ['#d9a35b', '#b7c46a', '#e0866b']),
				'#d9a35b'
			),
			props.instanced(PropKind.BRANCH_CORAL, this.placements(this.scatter(120, 95), 0.8, 2.2, coralColors), '#ff7a59'),
			props.instanced(
				PropKind.FAN_CORAL,
				this.placements(this.scatter(45, 95), 0.8, 1.9, ['#9b5cf0', '#e2475f', '#f08a3c']),
				'#9b5cf0'
			),
			props.instanced(
				PropKind.TUBE_SPONGE,
				this.placements(this.scatter(45, 95), 0.8, 1.6, ['#ffa13d', '#ffd166', '#e86f4c']),
				'#ffa13d'
			),
			props.instanced(
				PropKind.ANEMONE,
				this.placements(this.scatter(55, 95), 0.6, 1.3, ['#ff9fd2', '#c9a7ff', '#7ff0d8']),
				'#ff9fd2'
			)
		);
		this.rocks(45, 100, 0.8, 4.2, ['#7d776a', '#6b6f6a', '#8a7f6c']);

		this.own(
			new KelpForest(
				context.water,
				context.patches,
				this.scatter(30, 90, -0.2).map((position) => ({ position, height: this.random.range(3, 7) })),
				3
			)
		);

		const fishPalettes = [
			['#ffd23f', '#ffe066'],
			['#2d7dd2', '#5fa8ff'],
			['#ff8c42', '#ffffff'],
			['#c0d6df', '#e8f1f2']
		];

		this.scatter(fishPalettes.length, 70, 0).forEach((spot, index) => {
			spot.y += this.random.range(3, 6);
			this.school(spot, {
				count: 40 + index * 15,
				radius: this.random.range(4, 8),
				height: 3,
				speed: this.random.range(0.25, 0.45),
				scale: index === 3 ? 0.55 : 0.4,
				colors: fishPalettes[index] ?? ['#ffffff'],
				seed: 100 + index
			});
		});

		for (let i = 0; i < 2; i++) {
			const turtle = this.own(
				new Turtle(
					context.water,
					this.centre.clone().setY(this.centre.y + 5 + i * 2),
					22 + i * 12,
					0.06 + i * 0.03,
					i * 3
				)
			);
			this._turtles.push(turtle);
		}

		this.shardSpots.push(...this.scatter(5, 60, 1.6, 0.3));
		this.vent(this.ground(this.centre.x + 12, this.centre.z - 30), 13);

		// Mara's dive marker at the far edge of the reef, where the canyon starts to fall away
		this.marker = this.ground(this.centre.x - 6, this.centre.z - 85, 0);
		this._beaconMaterial = new MeshBasicMaterial({ color: new Color('#ff4d3a').multiplyScalar(4) });
		this.buildMarker(context);
	}

	public override update(frame: IFrameContext): void {
		this._turtles.forEach((turtle) => turtle.update(frame.elapsed));
		this._beaconMaterial.color.setRGB(1, 0.3, 0.23).multiplyScalar(Math.sin(frame.elapsed * 3) > 0.4 ? 5 : 0.2);
		this.updateVents(frame.elapsed);
	}

	public override dispose(): void {
		super.dispose();
		this._markerParts.forEach((part) => part.dispose());
	}

	/** Weighted block, a rope and a float with a blinking light. */
	private buildMarker(context: ISceneContext): void {
		const concrete = patchMaterial(new MeshLambertMaterial({ color: '#8d8a82' }), context.water.caustics);
		const rope = new MeshLambertMaterial({ color: '#e8d6a0' });
		const float = patchMaterial(new MeshLambertMaterial({ color: '#ffb000' }), context.water.caustics);
		const block = new BoxGeometry(1, 0.6, 1);
		const line = new CylinderGeometry(0.03, 0.03, 4, 4);
		const buoy = new SphereGeometry(0.45, 12, 8);
		const lamp = new SphereGeometry(0.12, 8, 6);
		this._markerParts.push(concrete, rope, float, block, line, buoy, lamp, this._beaconMaterial);

		const parts: [Mesh, number][] = [
			[new Mesh(block, concrete), 0.3],
			[new Mesh(line, rope), 2.6],
			[new Mesh(buoy, float), 4.7],
			[new Mesh(lamp, this._beaconMaterial), 5.2]
		];

		parts.forEach(([mesh, height]) => {
			mesh.position.copy(this.marker).setY(this.marker.y + height);
			this.add(mesh);
		});
	}
}
