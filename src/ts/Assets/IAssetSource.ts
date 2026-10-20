import type { LoadingManager } from 'three';

/** One thing to fetch. Every source loads through the shared LoadingManager, so progress covers them all. */
export default interface IAssetSource<TAsset> {
	readonly url: string;
	/** Optional assets resolve to null when missing (e.g. voice lines not recorded yet). */
	readonly isOptional: boolean;
	load(manager: LoadingManager): Promise<TAsset>;
}
