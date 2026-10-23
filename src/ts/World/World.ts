import {
	Group,
	Scene,
	Texture,
	type Camera,
	type Mesh,
	type Object3D,
	type ShaderMaterial,
	type Vector3,
	type WebGLRenderer
} from 'three';
import { MODEL_NAMES, type ModelName } from '../Config/assets.ts';
import { SURFACE_Y } from '../Config/world.ts';
import { patchMaterial, type IMaterialPatch } from '../Helpers/MaterialPatch.ts';
import WaterUniforms from './Water/WaterUniforms.ts';
import WaterSurface from './Water/WaterSurface.ts';
import WaterBackdrop from './Water/WaterBackdrop.ts';
import SunsetSky from './Sky/SunsetSky.ts';
import OpenSea from './Sky/OpenSea.ts';
import LightShafts from './Water/LightShafts.ts';
import MarineSnow from './Water/MarineSnow.ts';
import Seabed from './Terrain/Seabed.ts';
import SceneLighting from './Lighting/SceneLighting.ts';
import Atmosphere from './Lighting/Atmosphere.ts';
import LifePatches from './Life/LifePatches.ts';
import ReefScene from './Scenes/ReefScene.ts';
import KelpScene from './Scenes/KelpScene.ts';
import WreckScene from './Scenes/WreckScene.ts';
import PassageScene from './Scenes/PassageScene.ts';
import TempleScene from './Scenes/TempleScene.ts';
import AtlantisScene from './Scenes/AtlantisScene.ts';
import SignalBeacon from './Effects/SignalBeacon.ts';
import Sonar from './Effects/Sonar.ts';
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
	public readonly sky = new SunsetSky(this.water);
	public readonly sea = new OpenSea(this.water);
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
	public readonly sonar = new Sonar(this.water);

	/** What only exists below the surface: the water's backdrop and surface, light shafts, specks, bubbles. */
	private readonly _underwater = new Group();
	private readonly _patches = new LifePatches(this.water);
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
			assets,
			terrain: this.seabed,
			fish: fishPart
		};

		this.reef = new ReefScene(context);
		this.kelp = new KelpScene(context);
		this.wreck = new WreckScene(context);
		this.passage = new PassageScene(context);
		this.temple = new TempleScene(context);
		this.atlantis = new AtlantisScene(context);
		this.scenes = [this.reef, this.kelp, this.wreck, this.passage, this.temple, this.atlantis];

		this.atmosphere.attach(this.scene, environment);
		this._underwater.add(this.backdrop, this.surface, this.bubbles, this.shafts, this.snow);
		this.scene.add(
			this._underwater,
			this.sky,
			this.sea,
			this.seabed,
			this.lighting,
			...this.scenes,
			this.atlantis.light,
			this.beacon,
			// The whale travels further than its own scene (it comes back over Atlantis): never culled with it
			this.passage.whale
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
		this.water.update(frame.elapsed, frame.delta);
		this.surface.update(frame.delta);
		this.bubbles.update(frame.delta);
		this.sonar.update(frame.delta);
		this._trail?.update(camera, progress, frame.elapsed);

		for (const scene of this.scenes) {
			// The whale keeps swimming out of sight; everything else only animates while drawn
			if (scene.visible || scene === this.passage) {
				scene.update(frame);
			}
		}
	}

	/**
	 * Before the first frame: compiles every shader and uploads every texture, including those of things
	 * hidden right now (far scenes, the sky above the surface, the beacon), so nothing stalls a frame the
	 * first time it comes into view. three only compiles what's visible, so all of it is shown while
	 * compiling, then hidden again.
	 */
	public async warmUp(renderer: WebGLRenderer, camera: Camera): Promise<void> {
		const hidden: Object3D[] = [];
		const textures = new Set<Texture>();

		this.scene.traverse((object) => {
			if (!object.visible) {
				hidden.push(object);
				object.visible = true;
			}

			const materials = (object as Partial<Mesh>).material;

			for (const material of Array.isArray(materials) ? materials : materials ? [materials] : []) {
				const uniforms = (material as Partial<ShaderMaterial>).uniforms ?? {};
				const values = [...Object.values(material), ...Object.values(uniforms).map((uniform) => uniform?.value)];
				values
					.filter((value): value is Texture => value instanceof Texture)
					.forEach((texture) => textures.add(texture));
			}
		});

		await renderer.compileAsync(this.scene, camera);
		textures.forEach((texture) => renderer.initTexture(texture));
		hidden.forEach((object) => (object.visible = false));
	}

	/** Camera-relative work once the camera has moved: culling, the surface and backdrop, the beacon. */
	public syncToCamera(camera: Camera, frame: IFrameContext): void {
		// Above the surface only the sky and the sea are left; below, only the water
		const isAbove = camera.position.y > SURFACE_Y;
		this.sky.visible = isAbove;
		this.sea.visible = isAbove;
		this._underwater.visible = !isAbove;

		this.sky.follow(camera);
		this.sea.follow(camera);
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
		this.shafts.flash = value;
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
			this.sky,
			this.sea,
			this.shafts,
			this.snow,
			...this.scenes,
			this.beacon,
			this.bubbles
		];

		disposables.forEach((disposable) => disposable.dispose());
		this._trail?.dispose();
	}
}
