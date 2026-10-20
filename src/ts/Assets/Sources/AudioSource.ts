import { FileLoader, type LoadingManager } from 'three';
import type IAssetSource from '../IAssetSource.ts';

/**
 * Encoded audio as raw bytes. Decoding needs an AudioContext, which browsers only allow after a user
 * gesture, so it happens later in the audio engine.
 */
export default class AudioSource implements IAssetSource<ArrayBuffer | null> {
	public readonly url: string;
	public readonly isOptional: boolean;

	constructor(url: string, isOptional: boolean) {
		this.url = url;
		this.isOptional = isOptional;
	}

	public async load(manager: LoadingManager): Promise<ArrayBuffer | null> {
		const loader = new FileLoader(manager).setResponseType('arraybuffer');

		try {
			return (await loader.loadAsync(this.url)) as ArrayBuffer;
		} catch (error: unknown) {
			if (this.isOptional) {
				return null;
			}

			throw error;
		}
	}
}
