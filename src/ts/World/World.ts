import { Scene, type Camera, type Vector3 } from 'three';
import WaterUniforms from './Water/WaterUniforms.ts';
import WaterSurface from './Water/WaterSurface.ts';
import LightShafts from './Water/LightShafts.ts';
import MarineSnow from './Water/MarineSnow.ts';
import Seabed from './Terrain/Seabed.ts';
import SceneLighting from './Lighting/SceneLighting.ts';
import Atmosphere from './Lighting/Atmosphere.ts';
import LifePatches from './Life/LifePatches.ts';
import FishSchool from './Life/FishSchool.ts';
import PropFactory from './Props/PropFactory.ts';
import ReefScene from './Scenes/ReefScene.ts';
import KelpScene from './Scenes/KelpScene.ts';
import WreckScene from './Scenes/WreckScene.ts';
import PassageScene from './Scenes/PassageScene.ts';
import TempleScene from './Scenes/TempleScene.ts';
import AtlantisScene from './Scenes/AtlantisScene.ts';
import ShardField from './Collectibles/ShardField.ts';
import SignalBeacon from './Effects/SignalBeacon.ts';
import DiverBubbles from './Effects/DiverBubbles.ts';
import Diver from './Diver/Diver.ts';
import type DiveScene from './Scenes/DiveScene.ts';
import type DiverController from './Diver/DiverController.ts';
import type ISceneContext from './Scenes/ISceneContext.ts';
import type IDisposable from '../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../Contracts/IEnvironmentAware.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';

/** Builds the scene graph and advances everything that lives in it. */
export default class World implements IResizable, IDisposable {
	public readonly scene = new Scene();
	public readonly water = new WaterUniforms();
	public readonly seabed = new Seabed(this.water);
	public readonly surface = new WaterSurface(this.water);
	public readonly shafts = new LightShafts(this.water);
	public readonly snow = new MarineSnow(this.water);
	public readonly lighting = new SceneLighting();
	public readonly atmosphere = new Atmosphere();
	public readonly reef: ReefScene;
	public readonly kelp: KelpScene;
	public readonly wreck: WreckScene;
	public readonly passage: PassageScene;
	public readonly temple: TempleScene;
	public readonly atlantis: AtlantisScene;
	public readonly scenes: readonly DiveScene[];
	public readonly shards: ShardField;
	public readonly beacon = new SignalBeacon();
	public readonly bubbles = new DiverBubbles();
	public readonly diver: Diver;

	private readonly _patches = new LifePatches(this.water);
	private readonly _props = new PropFactory(this.water);
	private readonly _fishGeometry = FishSchool.createGeometry();

	constructor(controller: DiverController) {
		const context: ISceneContext = {
			water: this.water,
			patches: this._patches,
			props: this._props,
			terrain: this.seabed,
			fishGeometry: this._fishGeometry
		};

		this.reef = new ReefScene(context);
		this.kelp = new KelpScene(context);
		this.wreck = new WreckScene(context);
		this.passage = new PassageScene(context);
		this.temple = new TempleScene(context);
		this.atlantis = new AtlantisScene(context);
		this.scenes = [this.reef, this.kelp, this.wreck, this.passage, this.temple, this.atlantis];

		this.shards = new ShardField(
			this.scenes.flatMap((scene) => scene.shardSpots.map((position) => ({ scene: scene.config.id, position })))
		);
		this.diver = new Diver(
			this.water,
			this.seabed,
			this.scenes.flatMap((scene) => scene.colliders),
			controller
		);

		this.atmosphere.attach(this.scene);
		this.scene.add(
			this.seabed,
			this.surface,
			this.lighting,
			...this.scenes,
			this.atlantis.light,
			this.shards,
			this.beacon,
			this.diver.root,
			this.bubbles,
			this.shafts,
			this.snow
		);
	}

	public get environmentTargets(): IEnvironmentAware[] {
		return [this.water, this.surface, this.shafts, this.snow, this.lighting, this.atmosphere];
	}

	public resize(size: IViewportSize): void {
		this.snow.pixelRatio = size.pixelRatio;
		this.bubbles.pixelRatio = size.pixelRatio;
		this.scenes.forEach((scene) => scene.vents.forEach((vent) => (vent.pixelRatio = size.pixelRatio)));
	}

	/** Simulation step: the diver, the life around them and the pickups. */
	public simulate(frame: IFrameContext, darkness: number): void {
		this.water.update(frame.elapsed);
		this.diver.update(frame.elapsed, frame.delta, darkness);
		this.bubbles.update(frame.delta);
		this.shards.update(this.diver.position, frame.elapsed);

		for (const scene of this.scenes) {
			// The whale keeps swimming out of sight; everything else only animates while drawn
			if (scene.visible || scene === this.passage) {
				scene.update(frame, this.diver.position);
			}
		}
	}

	/** Camera-relative work once the camera has moved: culling, the surface, the beacon. */
	public syncToCamera(camera: Camera, frame: IFrameContext): void {
		this.surface.follow(camera);
		this.lighting.follow(this.diver.position);
		this.beacon.update(camera, frame.elapsed, frame.delta);
		this.scenes.forEach((scene) => scene.cull(camera.position));
	}

	/** 0..1 how enclosed the point is. */
	public shelterAt(point: Vector3): number {
		return this.scenes.reduce((shelter, scene) => Math.max(shelter, scene.shelterAt(point)), 0);
	}

	/** True inside any air column. */
	public hasAirAt(point: Vector3): boolean {
		return this.scenes.some((scene) => scene.visible && scene.vents.some((vent) => vent.contains(point)));
	}

	/** The scene whose stretch of canyon the point is in. */
	public sceneAt(point: Vector3): DiveScene {
		let best: DiveScene = this.reef;
		let distance = Infinity;

		for (const scene of this.scenes) {
			const d = Math.abs(point.z - scene.centre.z);

			if (d < distance) {
				distance = d;
				best = scene;
			}
		}

		return best;
	}

	public dispose(): void {
		const disposables: IDisposable[] = [
			this.seabed,
			this.surface,
			this.shafts,
			this.snow,
			...this.scenes,
			this.shards,
			this.beacon,
			this.bubbles,
			this.diver,
			this._props
		];

		disposables.forEach((disposable) => disposable.dispose());
		this._fishGeometry.dispose();
	}
}
