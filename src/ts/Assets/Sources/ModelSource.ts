import type { AnimationClip, Group, LoadingManager } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type IAssetSource from '../IAssetSource.ts';

export interface ILoadedModel {
	readonly scene: Group;
	readonly animations: readonly AnimationClip[];
}

/** A meshopt-compressed glTF binary, with its animation clips. */
export default class ModelSource implements IAssetSource<ILoadedModel> {
	public readonly isOptional = false;
	public readonly url: string;

	constructor(url: string) {
		this.url = url;
	}

	public async load(manager: LoadingManager): Promise<ILoadedModel> {
		const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
		const gltf = await loader.loadAsync(this.url);

		return { scene: gltf.scene, animations: gltf.animations };
	}
}
