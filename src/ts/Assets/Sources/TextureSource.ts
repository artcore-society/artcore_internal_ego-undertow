import { NoColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader, type LoadingManager, type Texture } from 'three';
import type IAssetSource from '../IAssetSource.ts';

/** A tiling texture: colour maps in sRGB, data maps (normal, roughness) linear. */
export default class TextureSource implements IAssetSource<Texture> {
	public readonly isOptional = false;
	public readonly url: string;

	private readonly _isColor: boolean;
	private readonly _anisotropy: number;

	constructor(url: string, isColor: boolean, anisotropy: number) {
		this.url = url;
		this._isColor = isColor;
		this._anisotropy = anisotropy;
	}

	public async load(manager: LoadingManager): Promise<Texture> {
		const texture = await new TextureLoader(manager).loadAsync(this.url);

		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		texture.anisotropy = this._anisotropy;
		texture.colorSpace = this._isColor ? SRGBColorSpace : NoColorSpace;

		return texture;
	}
}
