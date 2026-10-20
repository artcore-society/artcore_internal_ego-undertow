export default interface IFrameContext {
	/** Seconds since the previous frame (clamped). */
	readonly delta: number;
	/** Seconds since the ticker started. */
	readonly elapsed: number;
}
