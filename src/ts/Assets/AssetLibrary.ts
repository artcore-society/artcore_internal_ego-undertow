import {
	BufferAttribute,
	LoadingManager,
	Mesh,
	type AnimationClip,
	type BufferGeometry,
	type Group,
	type Material,
	type Object3D,
	type Texture,
	type WebGLRenderer
} from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import ModelSource from './Sources/ModelSource.ts';
import TextureSource from './Sources/TextureSource.ts';
import AudioSource from './Sources/AudioSource.ts';
import {
	ASSET_BASE,
	MODEL_NAMES,
	TEXTURE_MAPS,
	TEXTURE_SETS,
	type ModelName,
	type TextureMap,
	type TextureSet
} from '../Config/assets.ts';
import { NARRATION } from '../Journey/narration.ts';
import type IAssetSource from './IAssetSource.ts';
import type IDisposable from '../Contracts/IDisposable.ts';

export interface IModelPart {
	readonly geometry: BufferGeometry;
	readonly material: Material;
}

export interface ILoadProgress {
	readonly loaded: number;
	readonly total: number;
	/** 0..1 */
	readonly ratio: number;
}

/**
 * Loads everything the journey needs, once, the way three.js recommends: one LoadingManager shared by
 * every loader, so `load()` resolves only when all items are in and reports progress across all of them.
 * Afterwards the library hands out shared, typed assets; nothing is fetched twice.
 */
export default class AssetLibrary implements IDisposable {
	private readonly _manager = new LoadingManager();
	private readonly _models = new Map<ModelName, Group>();
	private readonly _animations = new Map<ModelName, readonly AnimationClip[]>();
	private readonly _textures = new Map<string, Texture>();
	private readonly _voices = new Map<string, ArrayBuffer>();
	private readonly _anisotropy: number;
	private _isLoaded = false;

	constructor(renderer: WebGLRenderer) {
		this._anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
	}

	public get isLoaded(): boolean {
		return this._isLoaded;
	}

	public async load(onProgress: (progress: ILoadProgress) => void): Promise<void> {
		this._manager.onProgress = (_url, loaded, total) =>
			onProgress({ loaded, total, ratio: total ? loaded / total : 1 });

		await Promise.all([
			...MODEL_NAMES.map((name) =>
				this.fetch(new ModelSource(`${ASSET_BASE}/models/${name}.glb`), (model) => {
					this._models.set(name, model.scene);
					this._animations.set(name, model.animations);
				})
			),
			...TEXTURE_SETS.flatMap((set) =>
				TEXTURE_MAPS.map((map) =>
					this.fetch(
						new TextureSource(`${ASSET_BASE}/textures/${set}/${map}.webp`, map === 'diffuse', this._anisotropy),
						(texture) => this._textures.set(AssetLibrary.textureKey(set, map), texture)
					)
				)
			),
			...NARRATION.map((line) =>
				this.fetch(new AudioSource(`${ASSET_BASE}/voice/${line.id}.mp3`, true), (buffer) => {
					if (buffer) {
						this._voices.set(line.id, buffer);
					}
				})
			)
		]);

		this._isLoaded = true;
	}

	/** A fresh copy of a model; geometry and materials are shared. Rigged models get their own skeleton. */
	public model(name: ModelName): Object3D {
		return cloneSkinned(this.source(name));
	}

	/** The animation clips that came with a model. */
	public animations(name: ModelName): readonly AnimationClip[] {
		return this._animations.get(name) ?? [];
	}

	/** Every material of a model, e.g. to patch them all once. */
	public materials(name: ModelName): Material[] {
		const materials = new Set<Material>();
		this.source(name).traverse((child) => {
			if (child instanceof Mesh) {
				materials.add(child.material as Material);
			}
		});

		return [...materials];
	}

	/** Every mesh of a model with its transform baked into a float copy of the geometry, ready for instancing. */
	public parts(name: ModelName): IModelPart[] {
		const model = this.source(name);
		const parts: IModelPart[] = [];

		model.updateMatrixWorld(true);
		model.traverse((child) => {
			if (child instanceof Mesh) {
				parts.push({
					geometry: AssetLibrary.dequantize(child.geometry as BufferGeometry).applyMatrix4(child.matrixWorld),
					material: child.material as Material
				});
			}
		});

		return parts;
	}

	public texture(set: TextureSet, map: TextureMap): Texture {
		const texture = this._textures.get(AssetLibrary.textureKey(set, map));

		if (!texture) {
			throw new Error(`Texture ${set}/${map} is not loaded`);
		}

		return texture;
	}

	/** Encoded voice line, or null when it hasn't been recorded. */
	public voice(id: string): ArrayBuffer | null {
		return this._voices.get(id) ?? null;
	}

	public dispose(): void {
		this._textures.forEach((texture) => texture.dispose());
		this._models.forEach((model) =>
			model.traverse((child) => {
				if (child instanceof Mesh) {
					(child.geometry as BufferGeometry).dispose();
					(child.material as Material).dispose();
				}
			})
		);
		this._voices.clear();
	}

	private async fetch<TAsset>(source: IAssetSource<TAsset>, store: (asset: TAsset) => void): Promise<void> {
		store(await source.load(this._manager));
	}

	private source(name: ModelName): Group {
		const model = this._models.get(name);

		if (!model) {
			throw new Error(`Model ${name} is not loaded`);
		}

		return model;
	}

	private static textureKey(set: TextureSet, map: TextureMap): string {
		return `${set}/${map}`;
	}

	/**
	 * A float copy of a geometry. Meshopt stores attributes as normalized integers; baking a transform
	 * into those would overflow their range.
	 */
	private static dequantize(source: BufferGeometry): BufferGeometry {
		const geometry = source.clone();

		for (const name of Object.keys(geometry.attributes)) {
			const attribute = geometry.getAttribute(name);
			const values = new Float32Array(attribute.count * attribute.itemSize);

			for (let i = 0; i < attribute.count; i++) {
				for (let component = 0; component < attribute.itemSize; component++) {
					values[i * attribute.itemSize + component] = attribute.getComponent(i, component);
				}
			}

			geometry.setAttribute(name, new BufferAttribute(values, attribute.itemSize));
		}

		return geometry;
	}
}
