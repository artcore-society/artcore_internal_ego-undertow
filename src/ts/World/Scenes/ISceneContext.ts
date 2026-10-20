import type WaterUniforms from '../Water/WaterUniforms.ts';
import type LifePatches from '../Life/LifePatches.ts';
import type PropFactory from '../Props/PropFactory.ts';
import type AssetLibrary from '../../Assets/AssetLibrary.ts';
import type { IModelPart } from '../../Assets/AssetLibrary.ts';
import type ITerrainSampler from '../../Contracts/ITerrainSampler.ts';

/** Shared building blocks every scene draws from. */
export default interface ISceneContext {
	readonly water: WaterUniforms;
	readonly patches: LifePatches;
	readonly props: PropFactory;
	readonly assets: AssetLibrary;
	readonly terrain: ITerrainSampler;
	/** The fish model, normalised for the swim shader. */
	readonly fish: IModelPart;
}
