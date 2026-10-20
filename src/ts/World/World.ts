import { Scene, type Camera, type Texture, type Vector3 } from 'three';
import { MODEL_NAMES, type ModelName } from '../Config/assets.ts';
import { patchMaterial, type IMaterialPatch } from '../Helpers/MaterialPatch.ts';
import WaterUniforms from './Water/WaterUniforms.ts';
import WaterSurface from './Water/WaterSurface.ts';
import WaterBackdrop from './Water/WaterBackdrop.ts';
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
import SignalBeacon from './Effects/SignalBeacon.ts';
import DiverBubbles from './Effects/DiverBubbles.ts';
import LightTrail, { type ITrailSpot } from './Effects/LightTrail.ts';
import type DiveScene from './Scenes/DiveScene.ts';
import type { SceneWeights } from '../Audio/SoundDirector.ts';
import type ISceneContext from './Scenes/ISceneContext.ts';
import type AssetLibrary from '../Assets/AssetLibrary.ts';
import type IDisposable from '../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../Contracts/IEnvironmentAware.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';

/** Builds the scene graph from the loaded assets and advances everything that lives in it. */
export default class World implements IResizable, IDisposable {
	public readonly scene = new Scene();
	public readonly water = new WaterUniforms();
	public readonly seabed: Seabed;
	public readonly surface = new WaterSurface(this.water);
	public readonly backdrop = new WaterBackdrop();
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
	public readonly beacon = new SignalBeacon();
	public readonly bubbles = new DiverBubbles();

	private readonly _patches = new LifePatches(this.water);
	private readonly _props = new PropFactory(this.water);
	private _trail: LightTrail | null = null;

	constructor(assets: AssetLibrary, environment: Texture) {
		// Every glTF material gets the caustics; seaweed also sways. The fish and the whale patch their own copies.
		const sway: Partial<Record<ModelName, IMaterialPatch>> = {
			claret_tall_seaweed: this._patches.sway(0.35, 2),
			claret_wiggle_seaweed: this._patches.sway(0.3, 2),
			blue_sea_anemone_l: this._patches.sway(0.06, 1.4)
		};

		MODEL_NAMES.filter((name) => name !== 'barramundi_fish' && name !== 'humpback_whale').forEach((name) => {
			const extra = sway[name];
			assets
				.materials(name)
				.forEach((material) => patchMaterial(material, this.water.caustics, ...(extra ? [extra] : [])));
		});

		this.seabed = new Seabed(this.water, assets);

		const [fishPart] = assets.parts('barramundi_fish');

		if (!fishPart) {
			throw new Error('The fish model has no mesh');
		}

		const context: ISceneContext = {
			water: this.water,
			patches: this._patches,
			props: this._props,
			assets,
			terrain: this.seabed,
			fish: FishSchool.template(fishPart, true)
		};

		this.reef = new ReefScene(context);
		this.kelp = new KelpScene(context);
		this.wreck = new WreckScene(context);
		this.passage = new PassageScene(context);
		this.temple = new TempleScene(context);
		this.atlantis = new AtlantisScene(context);
		this.scenes = [this.reef, this.kelp, this.wreck, this.passage, this.temple, this.atlantis];

		this.atmosphere.attach(this.scene, environment);
		this.scene.add(
			this.backdrop,
			this.seabed,
			this.surface,
			this.lighting,
			...this.scenes,
			this.atlantis.light,
			this.beacon,
			this.bubbles,
			this.shafts,
			this.snow
		);
	}

	public get environmentTargets(): IEnvironmentAware[] {
		return [this.water, this.surface, this.backdrop, this.shafts, this.snow, this.lighting, this.atmosphere];
	}

	public get trail(): LightTrail | null {
		return this._trail;
	}

	/** Lays Mara's trail of light along the way the camera will go. */
	public layTrail(spots: readonly ITrailSpot[]): LightTrail {
		this._trail?.removeFromParent();
		this._trail?.dispose();
		this._trail = new LightTrail(spots);
		this.scene.add(this._trail);

		return this._trail;
	}

	public resize(size: IViewportSize): void {
		this.snow.pixelRatio = size.pixelRatio;
		this.bubbles.pixelRatio = size.pixelRatio;
	}

	public simulate(frame: IFrameContext, camera: Vector3, progress: number): void {
		this.water.update(frame.elapsed);
		this.surface.update(frame.delta);
		this.bubbles.update(frame.delta);
		this._trail?.update(camera, progress, frame.elapsed);

		for (const scene of this.scenes) {
			// The whale keeps swimming out of sight; everything else only animates while drawn
			if (scene.visible || scene === this.passage) {
				scene.update(frame);
			}
		}
	}

	/** Camera-relative work once the camera has moved: culling, the surface and backdrop, the beacon. */
	public syncToCamera(camera: Camera, frame: IFrameContext): void {
		this.surface.follow(camera);
		this.backdrop.follow(camera);
		this.lighting.follow(camera.position);
		this.beacon.update(camera, frame.elapsed, frame.delta);
		this.scenes.forEach((scene) => scene.cull(camera.position));
	}

	/** Hides every obstacle the camera would pass through. */
	public clearPath(path: readonly Vector3[], clearance: number): void {
		this.scenes.forEach((scene) => scene.clearPath(path, clearance));
	}

	/** 0..1 lightning from the storm overhead. */
	public set flash(value: number) {
		this.surface.flash = value;
		this.backdrop.flash = value;
		this.lighting.flash = value;
	}

	/** 0..1 per place: 1 in its heart, fading out over its radius. Drives the soundscape. */
	public sceneWeights(point: Vector3): SceneWeights {
		const weights: Record<string, number> = {};

		for (const scene of this.scenes) {
			const distance = point.distanceTo(scene.centre);
			weights[scene.config.id] = Math.max(0, Math.min(1, 1.6 - distance / scene.config.radius));
		}

		return weights as SceneWeights;
	}

	/** 0..1 how enclosed the point is. */
	public shelterAt(point: Vector3): number {
		return this.scenes.reduce((shelter, scene) => Math.max(shelter, scene.shelterAt(point)), 0);
	}

	public dispose(): void {
		const disposables: IDisposable[] = [
			this.seabed,
			this.surface,
			this.backdrop,
			this.shafts,
			this.snow,
			...this.scenes,
			this.beacon,
			this.bubbles,
			this._props
		];

		disposables.forEach((disposable) => disposable.dispose());
		this._trail?.dispose();
	}
}
