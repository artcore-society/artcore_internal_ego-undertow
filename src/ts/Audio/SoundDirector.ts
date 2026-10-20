import AudioEngine from './AudioEngine.ts';
import UnderwaterAmbience from './UnderwaterAmbience.ts';
import DeepDrone from './DeepDrone.ts';
import SoundEffects from './SoundEffects.ts';
import type IDisposable from '../Contracts/IDisposable.ts';

/** Owns the audio graph: ambient layers driven by depth and air, plus one-shot effects. */
export default class SoundDirector implements IDisposable {
	private static readonly HEARTBEAT_SECONDS = 0.95;

	public readonly effects: SoundEffects;

	private readonly _engine = new AudioEngine();
	private readonly _ambience = new UnderwaterAmbience(this._engine);
	private readonly _drone = new DeepDrone(this._engine);
	private _heartbeatTimer = 0;

	constructor() {
		this.effects = new SoundEffects(this._engine);
	}

	public get isMuted(): boolean {
		return this._engine.isMuted;
	}

	/** Must be called from a user gesture. */
	public async start(): Promise<void> {
		await this._engine.unlock();
		this._ambience.start();
		this._drone.start();
	}

	public toggleMute(): boolean {
		return this._engine.toggleMute();
	}

	public update(depth: number, isLowOxygen: boolean, delta: number): void {
		this._ambience.setLevel(1);
		this._drone.setLevel(Math.min(1, Math.max(0, (depth - 30) / 140)));

		if (!isLowOxygen) {
			this._heartbeatTimer = 0;

			return;
		}

		this._heartbeatTimer -= delta;

		if (this._heartbeatTimer <= 0) {
			this._heartbeatTimer = SoundDirector.HEARTBEAT_SECONDS;
			this.effects.heartbeat();
		}
	}

	public dispose(): void {
		this._engine.dispose();
	}
}
