import { Euler, Group, Object3D, Vector3 } from 'three';
import { canyonCentre, canyonWidthAt, floorAt, type ISceneConfig } from '../../Config/world.ts';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import AirVent from '../Effects/AirVent.ts';
import FishSchool, { type IFishSchoolOptions } from '../Life/FishSchool.ts';
import SphereCollider from '../Colliders/SphereCollider.ts';
import type ShelterZone from '../Colliders/ShelterZone.ts';
import { PropKind, type IPropPlacement } from '../Props/PropFactory.ts';
import type ISceneContext from './ISceneContext.ts';
import type ICollider from '../../Contracts/ICollider.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * One place along the descent. Owns its props, life, colliders, air vents and shard spots,
 * and hides itself when the camera is too far away to see it.
 */
export default abstract class DiveScene extends Group implements IDisposable {
	/** Extra distance beyond the scene radius it stays drawn; past this the fog has swallowed it. */
	private static readonly DRAW_MARGIN = 120;

	public readonly config: ISceneConfig;
	public readonly centre: Vector3;
	public readonly colliders: ICollider[] = [];
	public readonly shardSpots: Vector3[] = [];
	public readonly vents: AirVent[] = [];
	/** Enclosed spaces: inside them the sun is dimmed. */
	protected readonly shelters: ShelterZone[] = [];

	protected readonly context: ISceneContext;
	protected readonly random: SeededRandom;

	private readonly _disposables: IDisposable[] = [];

	protected constructor(config: ISceneConfig, context: ISceneContext, seed: number) {
		super();

		this.name = config.label;
		this.config = config;
		this.context = context;
		this.random = new SeededRandom(seed);
		this.centre = new Vector3(canyonCentre(config.z), floorAt(config.z), config.z);
	}

	/** 0..1 how enclosed a point is (inside a hull or a temple); dims sunlight there. */
	public shelterAt(point: Vector3): number {
		return this.shelters.reduce((cover, zone) => Math.max(cover, zone.coverAt(point)), 0);
	}

	public abstract update(frame: IFrameContext, diver: Vector3): void;

	public cull(camera: Vector3): void {
		this.visible = camera.distanceTo(this.centre) < this.config.radius + DiveScene.DRAW_MARGIN;
	}

	public override dispose(): void {
		this._disposables.forEach((disposable) => disposable.dispose());
		this.vents.forEach((vent) => vent.dispose());
		super.dispose();
	}

	protected own<TObject extends Object3D & IDisposable>(object: TObject): TObject {
		this._disposables.push(object);
		this.add(object);

		return object;
	}

	/** A point on the seabed, lifted by `lift` metres. */
	protected ground(x: number, z: number, lift = 0): Vector3 {
		return new Vector3(x, this.context.terrain.heightAt(x, z) + lift, z);
	}

	/** Random points on the canyon floor around the scene, keeping off the walls. */
	protected scatter(count: number, radius: number, lift = 0, keepOff = 0.42): Vector3[] {
		const points: Vector3[] = [];
		let attempts = 0;

		while (points.length < count && attempts < count * 20) {
			attempts++;

			const z = this.centre.z + this.random.range(-radius, radius);
			const width = canyonWidthAt(z) * keepOff;
			const x = canyonCentre(z) + this.random.range(-width, width);

			if (Math.hypot(x - this.centre.x, z - this.centre.z) <= radius) {
				points.push(this.ground(x, z, lift));
			}
		}

		return points;
	}

	protected placements(
		points: readonly Vector3[],
		minScale: number,
		maxScale: number,
		colors?: readonly string[]
	): IPropPlacement[] {
		return points.map((position, index) => {
			const color = colors?.[index % colors.length];

			return {
				position,
				scale: this.random.range(minScale, maxScale),
				rotation: new Euler(
					this.random.range(-0.15, 0.15),
					this.random.range(0, Math.PI * 2),
					this.random.range(-0.15, 0.15)
				),
				...(color ? { color } : {})
			};
		});
	}

	/** Rocks that the diver bumps into. */
	protected rocks(count: number, radius: number, minScale: number, maxScale: number, colors: readonly string[]): void {
		const placements = this.placements(this.scatter(count, radius, -0.4), minScale, maxScale, colors);

		this.add(this.context.props.instanced(PropKind.ROCK, placements, '#6b6f6a'));

		placements.forEach(({ position, scale }) => {
			const size = typeof scale === 'number' ? scale : scale.x;

			if (size > 1.4) {
				this.colliders.push(new SphereCollider(position, size * 0.85));
			}
		});
	}

	protected school(centre: Vector3, options: IFishSchoolOptions): FishSchool {
		const school = this.own(
			new FishSchool(this.context.water, this.context.patches, this.context.fishGeometry, options)
		);
		school.position.copy(centre);

		return school;
	}

	protected vent(position: Vector3, height: number): AirVent {
		const vent = new AirVent(this.context.water, position, height, this.vents.length * 13 + 5);
		this.vents.push(vent);
		this.add(vent);

		return vent;
	}

	protected updateVents(elapsed: number): void {
		this.vents.forEach((vent) => vent.update(elapsed));
	}
}
