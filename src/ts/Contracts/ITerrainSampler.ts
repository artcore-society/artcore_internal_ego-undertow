export default interface ITerrainSampler {
	/** Seabed height (world Y) at a point. */
	heightAt(x: number, z: number): number;
}
