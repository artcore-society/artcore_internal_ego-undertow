/** What the player wants the diver to do this frame, all axes -1..1. */
export default interface IDiverIntent {
	readonly forward: number;
	readonly turn: number;
	readonly vertical: number;
	readonly sprint: boolean;
}
