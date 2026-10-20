import type { BufferGeometry } from 'three';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type LifePatches from '../Life/LifePatches.ts';
import type PropFactory from '../Props/PropFactory.ts';
import type ITerrainSampler from '../../Contracts/ITerrainSampler.ts';

/** Shared building blocks every scene draws from. */
export default interface ISceneContext {
	readonly water: WaterUniforms;
	readonly patches: LifePatches;
	readonly props: PropFactory;
	readonly terrain: ITerrainSampler;
	readonly fishGeometry: BufferGeometry;
}
