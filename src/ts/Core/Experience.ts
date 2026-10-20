import { Vector3 } from 'three';
import ExperienceRenderer from './ExperienceRenderer.ts';
import Ticker from './Ticker.ts';
import Viewport from './Viewport.ts';
import AdaptiveQuality from './AdaptiveQuality.ts';
import World from '../World/World.ts';
import DiverController from '../World/Diver/DiverController.ts';
import FollowCamera, { CameraMode } from '../Camera/FollowCamera.ts';
import PointerOrbit from '../Camera/PointerOrbit.ts';
import PostProcessing from '../PostProcessing/PostProcessing.ts';
import SoundDirector from '../Audio/SoundDirector.ts';
import EnvironmentDirector from '../Environment/EnvironmentDirector.ts';
import OxygenTank from '../Dive/OxygenTank.ts';
import Checkpoint from '../Dive/Checkpoint.ts';
import BlackoutSequence from '../Dive/BlackoutSequence.ts';
import DiveSession from '../Dive/DiveSession.ts';
import Narrator from '../Story/Narrator.ts';
import StoryDirector from '../Story/StoryDirector.ts';
import StoryScript from '../Story/StoryScript.ts';
import EventBus from '../Services/EventBus.ts';
import InputService from '../Services/InputService.ts';
import { DIVER_START } from '../Config/world.ts';
import { GameMode } from '../Enums/GameMode.ts';
import { GamePhase } from '../Enums/GamePhase.ts';
import { InputAction } from '../Enums/InputAction.ts';
import type { ExperienceEventMap, ISignalBearing } from '../Enums/ExperienceEvent.ts';
import type IStoryContext from '../Story/IStoryContext.ts';
import type IDisposable from '../Contracts/IDisposable.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';

/**
 * Composition root: wires every subsystem together and runs the frame loop.
 * The Vue layer only talks to this facade and its typed event bus.
 */
export default class Experience implements IDisposable {
	private static readonly TELEMETRY_INTERVAL = 0.1;

	public readonly events = new EventBus<ExperienceEventMap>();

	private readonly _viewport: Viewport;
	private readonly _renderer: ExperienceRenderer;
	private readonly _ticker = new Ticker();
	private readonly _quality: AdaptiveQuality;
	private readonly _input: InputService;
	private readonly _orbit: PointerOrbit;
	private readonly _controller: DiverController;
	private readonly _world: World;
	private readonly _camera: FollowCamera;
	private readonly _post: PostProcessing;
	private readonly _sound = new SoundDirector();
	private readonly _environment = new EnvironmentDirector();
	private readonly _oxygen = new OxygenTank();
	private readonly _checkpoint = new Checkpoint();
	private readonly _blackout: BlackoutSequence;
	private readonly _session: DiveSession;
	private readonly _narrator = new Narrator();
	private readonly _story: StoryDirector;
	private readonly _signal = new Vector3();
	private readonly _projected = new Vector3();
	private readonly _unsubscribers: (() => void)[] = [];
	private _hasSignal = false;
	private _telemetryTimer = 0;

	constructor(canvas: HTMLCanvasElement) {
		const container = canvas.parentElement ?? document.body;

		this._viewport = new Viewport(container);
		this._renderer = new ExperienceRenderer(canvas);
		this._quality = new AdaptiveQuality(this._viewport);
		this._input = new InputService(container);
		this._orbit = new PointerOrbit(container);
		this._controller = new DiverController(this._input);
		this._world = new World(this._controller);
		this._camera = new FollowCamera(this._world.seabed, this._orbit);
		this._post = new PostProcessing(this._renderer, this._world.scene, this._camera);
		this._session = new DiveSession(this.events);
		this._blackout = new BlackoutSequence({
			fade: (level) => (this._post.fade = level),
			teleport: (checkpoint) => {
				this._world.diver.teleport(checkpoint.position.x, checkpoint.position.y, checkpoint.position.z, checkpoint.yaw);
				this._camera.snapBehind(this._world.diver);
				this._oxygen.refill();
			},
			setControl: (enabled) => (this._controller.enabled = enabled)
		});
		this._story = new StoryDirector(new StoryScript(this._world).chapters(), this.createStoryContext(), {
			chapterStarted: (card) => this.events.emit('chapter', card),
			objectiveChanged: (objective) => this.events.emit('objective', objective),
			completed: () => this._session.finish()
		});

		this._viewport.subscribe(this._renderer);
		this._viewport.subscribe(this._camera);
		this._viewport.subscribe(this._post);
		this._viewport.subscribe(this._world);

		this._environment.subscribe(...this._world.environmentTargets, this._post);

		this.placeAtStart();
		this._environment.update(this._world.diver.depth, 0, 10);
		this.bindInput();
		this.bindGameplay();
		this._ticker.add(this.update);
	}

	public get isMuted(): boolean {
		return this._sound.isMuted;
	}

	/** Compiles shaders up front so the first frames don't stutter, then starts rendering. */
	public async boot(): Promise<void> {
		await this._renderer.compileAsync(this._world.scene, this._camera);
		this._ticker.start();
		this.events.emit('ready', undefined);
	}

	/** Called from a user gesture: unlocks audio and starts the dive from the reef. */
	public async begin(mode: GameMode): Promise<void> {
		await this._sound.start();

		this._story.stop();
		this._narrator.clear();
		this._blackout.cancel();
		this._world.shards.reset();
		this._world.temple.reset();
		this._world.atlantis.reset();
		this._world.passage.whale.guide(false);
		this._environment.setIlluminated(false, true);
		this.setSignal(null);

		this.placeAtStart();
		this._checkpoint.set(this._world.diver.position, 0);
		this._camera.mode = CameraMode.FOLLOW;
		this._camera.snapBehind(this._world.diver);
		this._oxygen.refill();
		this._oxygen.isInfinite = mode === GameMode.FREE;
		this._controller.enabled = true;
		this._session.start(mode);

		if (mode === GameMode.STORY) {
			this._story.start();
		} else {
			this._world.shards.activateAll();
		}
	}

	/** After the ending: keep exploring without goals or air limits. */
	public continueFreely(): void {
		this._session.continueFreely();
		this._oxygen.isInfinite = true;
		this._controller.enabled = true;
		this._world.shards.activateAll();
		this._camera.mode = CameraMode.FOLLOW;
	}

	public toggleMute(): void {
		this.events.emit('muteChanged', this._sound.toggleMute());
	}

	public toggleFlashlight(): void {
		this._world.diver.flashlight.toggle();
	}

	public skipDialogue(): void {
		this._narrator.skip();
	}

	public dispose(): void {
		this._ticker.dispose();
		this._unsubscribers.forEach((unsubscribe) => unsubscribe());
		this._input.dispose();
		this._orbit.dispose();
		this._viewport.dispose();
		this._world.dispose();
		this._post.dispose();
		this._sound.dispose();
		this._renderer.dispose();
		this.events.clear();
	}

	private placeAtStart(): void {
		this._world.diver.teleport(DIVER_START.x, DIVER_START.y, DIVER_START.z, 0);
	}

	private createStoryContext(): IStoryContext {
		const session = (): DiveSession => this._session;

		return {
			diver: this._world.diver,
			world: this._world,
			narrator: this._narrator,
			get collected(): number {
				return session().shards;
			},
			setSignal: (target) => this.setSignal(target),
			setCheckpoint: (position, yaw = 0) => this._checkpoint.set(position, yaw),
			activateShards: (scene) => this._world.shards.activate(scene),
			showcase: (target, distance) => this._camera.showcase(target, this._world.diver.position, distance),
			setIlluminated: (enabled) => this._environment.setIlluminated(enabled),
			cue: (sound) => {
				if (sound === 'discovery') {
					this._sound.effects.discovery();
				} else if (sound === 'rumble') {
					this._sound.effects.rumble();
				} else {
					this._sound.effects.whaleSong();
				}
			},
			shake: (amount) => this._camera.shake(amount)
		};
	}

	private setSignal(target: Vector3 | null): void {
		this._hasSignal = target !== null;

		if (target) {
			this._signal.copy(target);
		}

		this._world.beacon.setTarget(target);
	}

	private bindInput(): void {
		this._unsubscribers.push(
			this._input.onPress(InputAction.TOGGLE_MUTE, () => this.toggleMute()),
			this._input.onPress(InputAction.FLASHLIGHT, () => this.toggleFlashlight())
		);
	}

	private bindGameplay(): void {
		const diver = this._world.diver;

		diver.onInhale(() => this._session.isPlaying && this._sound.effects.inhale(this._oxygen.isLow ? 1.5 : 1));
		diver.onExhale((regulator) => {
			this._world.bubbles.burst(regulator, 7);

			if (this._session.isPlaying) {
				this._sound.effects.exhale();
			}
		});

		this._world.shards.onCollect(() => {
			this._session.collect();
			this._sound.effects.chime(this._session.shards);
			this._camera.shake(0.08);
		});

		this._narrator.onChange((line) => this.events.emit('dialogue', line));
		this._narrator.onLine(() => this._sound.effects.radio());

		this._unsubscribers.push(
			this.events.on('phaseChanged', (phase) => {
				if (phase === GamePhase.FINISHED) {
					this.setSignal(null);
					this._oxygen.isInfinite = true;
				}
			})
		);
	}

	private readonly update = (frame: IFrameContext): void => {
		const diver = this._world.diver;

		this._world.simulate(frame, this._environment.darkness);
		this._camera.follow(diver, frame);
		this._world.syncToCamera(this._camera, frame);
		this._environment.update(diver.depth, this._world.shelterAt(diver.position), frame.delta);

		this._narrator.update(frame.delta);
		this._story.update(frame.delta);
		this._session.update(diver.depth, frame.delta);
		this.updateAir(frame.delta);
		this._blackout.update(frame.delta);
		this._sound.update(diver.depth, this._session.isPlaying && this._oxygen.isLow, frame.delta);
		this._quality.update(frame.delta);
		this.publishTelemetry(frame.delta);

		this._post.render(diver, this._session.isPlaying ? this.hypoxia() : 0, frame);
	};

	private updateAir(delta: number): void {
		const diver = this._world.diver;

		if (!this._session.isPlaying || this._blackout.isActive) {
			return;
		}

		this._oxygen.update(diver.depth, diver.isSprinting, this._world.hasAirAt(diver.position), delta);
		diver.breathRate = this._oxygen.isLow ? 1.8 : diver.isSprinting ? 1.5 : 1;

		if (this._oxygen.isEmpty) {
			this._session.registerBlackout();
			this._blackout.start(this._checkpoint);
			this.events.emit('blackout', 'You blacked out. The current carried you back to safer water.');
		}
	}

	/** 0..1 how starved of air the diver is. */
	private hypoxia(): number {
		return this._oxygen.isLow ? 1 - this._oxygen.level / 0.22 : 0;
	}

	private signalBearing(): ISignalBearing | null {
		if (!this._hasSignal) {
			return null;
		}

		this._projected.copy(this._signal).project(this._camera);

		const isBehind = this._projected.z > 1;
		const x = isBehind ? -this._projected.x : this._projected.x;
		const y = isBehind ? -this._projected.y : this._projected.y;

		return {
			angle: Math.atan2(x, y),
			distance: this._world.diver.position.distanceTo(this._signal),
			isVisible: !isBehind && Math.abs(x) < 0.92 && Math.abs(y) < 0.92
		};
	}

	private publishTelemetry(delta: number): void {
		this._telemetryTimer += delta;

		if (this._telemetryTimer < Experience.TELEMETRY_INTERVAL) {
			return;
		}

		this._telemetryTimer = 0;

		const diver = this._world.diver;
		this.events.emit('telemetry', {
			depth: diver.depth,
			oxygen: this._oxygen.level,
			isLowOxygen: this._session.isPlaying && this._oxygen.isLow,
			isSprinting: diver.isSprinting,
			isFlashlightOn: diver.flashlight.isOn,
			signal: this.signalBearing(),
			location: this._world.sceneAt(diver.position).config.label
		});
	}
}
