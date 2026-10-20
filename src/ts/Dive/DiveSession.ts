import { GamePhase } from '../Enums/GamePhase.ts';
import { GameMode } from '../Enums/GameMode.ts';
import type EventBus from '../Services/EventBus.ts';
import type { ExperienceEventMap } from '../Enums/ExperienceEvent.ts';

/** Phase, mode and the numbers the ending shows. */
export default class DiveSession {
	private readonly _events: EventBus<ExperienceEventMap>;
	private _phase: GamePhase = GamePhase.INTRO;
	private _mode: GameMode = GameMode.STORY;
	private _elapsed = 0;
	private _shards = 0;
	private _blackouts = 0;
	private _maxDepth = 0;

	constructor(events: EventBus<ExperienceEventMap>) {
		this._events = events;
	}

	public get isPlaying(): boolean {
		return this._phase === GamePhase.PLAYING;
	}

	public get mode(): GameMode {
		return this._mode;
	}

	public get shards(): number {
		return this._shards;
	}

	public start(mode: GameMode): void {
		this._mode = mode;
		this._elapsed = 0;
		this._shards = 0;
		this._blackouts = 0;
		this._maxDepth = 0;
		this._events.emit('modeChanged', mode);
		this._events.emit('shardsChanged', 0);
		this.setPhase(GamePhase.PLAYING);
	}

	public collect(): void {
		this._shards++;
		this._events.emit('shardsChanged', this._shards);
		this._events.emit('shardCollected', this._shards);
	}

	public registerBlackout(): void {
		this._blackouts++;
	}

	public update(depth: number, delta: number): void {
		if (this._phase !== GamePhase.PLAYING) {
			return;
		}

		this._elapsed += delta;
		this._maxDepth = Math.max(this._maxDepth, depth);
	}

	public finish(): void {
		this.setPhase(GamePhase.FINISHED);
		this._events.emit('finished', {
			mode: this._mode,
			duration: Math.round(this._elapsed),
			shards: this._shards,
			blackouts: this._blackouts,
			maxDepth: Math.round(this._maxDepth)
		});
	}

	/** After the ending: keep exploring without goals. */
	public continueFreely(): void {
		this._mode = GameMode.FREE;
		this._events.emit('modeChanged', this._mode);
		this.setPhase(GamePhase.PLAYING);
	}

	private setPhase(phase: GamePhase): void {
		this._phase = phase;
		this._events.emit('phaseChanged', phase);
	}
}
