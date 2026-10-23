import { Vector3 } from 'three';
import ExperienceRenderer from './ExperienceRenderer.ts';
import Ticker from './Ticker.ts';
import Viewport from './Viewport.ts';
import AdaptiveQuality from './AdaptiveQuality.ts';
import AssetLibrary from '../Assets/AssetLibrary.ts';
import World from '../World/World.ts';
import LightProbe from '../World/Lighting/LightProbe.ts';
import RailCamera from '../Camera/RailCamera.ts';
import PointerOrbit from '../Camera/PointerOrbit.ts';
import HeadLamp from '../Camera/HeadLamp.ts';
import PostProcessing from '../PostProcessing/PostProcessing.ts';
import SoundDirector from '../Audio/SoundDirector.ts';
import { composePostcard } from '../Services/Postcard.ts';
import { WHALE_SONG } from '../Audio/SoundEffects.ts';
import EnvironmentDirector from '../Environment/EnvironmentDirector.ts';
import Storm from '../Environment/Storm.ts';
import JourneyDirector from '../Journey/JourneyDirector.ts';
import JourneyScript, { type IJourneyActions } from '../Journey/JourneyScript.ts';
import EventBus from '../Services/EventBus.ts';
import ScrollInput from '../Services/ScrollInput.ts';
import { installUnderwaterFog } from '../Helpers/underwaterFog.ts';
import { damp } from '../Helpers/math.ts';
import type { IRailSample } from '../Journey/Rail.ts';
import { NARRATION } from '../Journey/narration.ts';
import { SUNSET_SUN, SURFACE_Y } from '../Config/world.ts';
import { SOUND_NAMES } from '../Config/assets.ts';
import { GamePhase } from '../Enums/GamePhase.ts';
import type { ExperienceEventMap, IHotspotView, ISignalView } from '../Enums/ExperienceEvent.ts';
import type { ICaption } from '../Journey/IJourney.ts';
import type { ITrailSpot } from '../World/Effects/LightTrail.ts';
import type IDisposable from '../Contracts/IDisposable.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';

/**
 * Composition root: loads the assets, builds the world from them, and runs the journey loop.
 * The Vue layer only talks to this facade and its typed event bus.
 */
export default class Experience implements IDisposable {
	private static readonly TELEMETRY_INTERVAL = 1 / 30;
	private static readonly BREATH_SECONDS = 5.5;
	/** Mara's "follow the light, little fish": her trail appears from here. */
	private static readonly TRAIL_FROM = 0.18;
	/** Metres kept clear of rocks and coral around the camera's path. */
	private static readonly PATH_CLEARANCE = 2.2;
	/** Scrolling slows to this while someone is speaking, so nobody gets talked over. */
	private static readonly LISTENING_PACE = 0.4;
	/** Once followed, the whale leads this far ahead of the camera until the temple comes into sight. */
	private static readonly WHALE_LEAD = 14;
	private static readonly WHALE_RELEASE = 0.665;
	/** Seconds from the credits up through the surface. */
	private static readonly RISE_SECONDS = 5.5;
	/** Fraction of the rise spent gliding up under the surface before kicking through it. */
	private static readonly BREACH_AT = 0.8;
	/** Fraction of the rise over which the gaze turns from where it was to the way up. */
	private static readonly TURN_SHARE = 0.4;
	/** Eye height above the water once afloat, metres. */
	private static readonly AFLOAT_HEIGHT = 1.3;

	public readonly events = new EventBus<ExperienceEventMap>();

	private readonly _viewport: Viewport;
	private readonly _renderer: ExperienceRenderer;
	private readonly _ticker = new Ticker();
	private readonly _quality: AdaptiveQuality;
	private readonly _assets: AssetLibrary;
	private readonly _scroll: ScrollInput;
	private readonly _orbit: PointerOrbit;
	private readonly _lamp = new HeadLamp();
	private readonly _sound = new SoundDirector();
	private readonly _environment = new EnvironmentDirector();
	private readonly _storm = new Storm();
	private readonly _projected = new Vector3();
	private readonly _forward = new Vector3();
	private readonly _local = new Vector3();
	private readonly _unsubscribers: (() => void)[] = [];
	private _world: World | null = null;
	private _probe: LightProbe | null = null;
	private _camera: RailCamera | null = null;
	private _post: PostProcessing | null = null;
	private _journey: JourneyDirector | null = null;
	private _phase: GamePhase = GamePhase.LOADING;
	/** For the postcard: the deepest point and the time spent under water this dive. */
	private _maxDepth = 0;
	private _diveSeconds = 0;
	/** Waiting for the next rendered frame (read straight after it's drawn: the buffer isn't kept). */
	private _frameRequests: ((canvas: HTMLCanvasElement) => void)[] = [];
	private _isWhaleLeading = false;
	private _lastProgress = 0;
	private _fade = 0;
	private _calm = 0;
	private _breath = 0;
	private _telemetryTimer = 0;
	private _hadHotspot = false;
	/** Seconds since surfacing began; negative while still under. */
	private _surfacing = -1;
	private _wasAbove = false;
	private readonly _rise = {
		from: new Vector3(),
		/** Where the camera was looking when the rise began, so the gaze turns from there. */
		look: new Vector3(),
		position: new Vector3(),
		target: new Vector3()
	};

	constructor(canvas: HTMLCanvasElement) {
		const container = canvas.parentElement ?? document.body;

		installUnderwaterFog();

		this._viewport = new Viewport(container);
		this._renderer = new ExperienceRenderer(canvas);
		this._quality = new AdaptiveQuality(this._viewport);
		this._assets = new AssetLibrary(this._renderer);
		this._scroll = new ScrollInput(container);
		this._orbit = new PointerOrbit(container);

		this._unsubscribers.push(
			this._scroll.onShortcut('m', () => this.toggleMute()),
			this._scroll.onShortcut('h', () => this.events.emit('help', undefined))
		);
		this._storm.onStrike((strike) => {
			this._sound.effects.thunder(strike.distance);

			const camera = this._camera;

			if (camera) {
				this._world?.surface.strike(strike, camera.position);
			}
		});
	}

	public get isMuted(): boolean {
		return this._sound.isMuted;
	}

	/** Loads every asset (with progress), builds the world, compiles shaders, then starts rendering. */
	public async boot(): Promise<void> {
		await this._assets.load((progress) => this.events.emit('loading', progress));

		const probe = new LightProbe(this._renderer);
		const world = new World(this._assets, probe.texture);
		const camera = new RailCamera(world.seabed, this._orbit);
		const journey = new JourneyDirector(new JourneyScript(world, this.createActions()).build(), {
			chapterChanged: (chapter) => this.events.emit('chapter', chapter),
			captionChanged: (caption) => this.onCaption(caption),
			stopChanged: (stop) => {
				world.beacon.setTarget(stop ? stop.hotspot() : null);
				this.events.emit('stop', stop ? { id: stop.id, label: stop.label } : null);
			},
			finished: () => this.setPhase(GamePhase.FINISHED)
		});

		NARRATION.forEach((line) => {
			const voice = this._assets.voice(line.id);

			if (voice) {
				this._sound.voices.register(line.id, voice);
			}
		});

		SOUND_NAMES.forEach((name) => {
			const sound = this._assets.sound(name);

			if (sound) {
				this._sound.surfaceSounds.register(name, sound);
			}
		});

		camera.add(this._lamp);
		world.scene.add(camera);
		world.clearPath(this.pathPoints(journey), Experience.PATH_CLEARANCE);
		world.layTrail(this.trailSpots(journey)).onGather((count) => {
			this._sound.effects.chime(count);
			this.events.emit('gathered', count);
		});

		this._probe = probe;
		this._world = world;
		// The waking light chimes as it reaches the gates, the far temples, the shrines: rising notes
		world.atlantis.onWakeMilestone((index) => this._sound.effects.chime(index * 2 + 2));
		this._camera = camera;
		this._journey = journey;
		this._post = new PostProcessing(this._renderer, world.scene, camera);

		this._viewport.subscribe(this._renderer);
		this._viewport.subscribe(camera);
		this._viewport.subscribe(this._post);
		this._viewport.subscribe(world);
		this._environment.subscribe(...world.environmentTargets, this._post);

		// Settle the first frame, then compile every shader before showing anything
		camera.follow(journey.sample, { delta: 0, elapsed: 0 });
		world.syncToCamera(camera, { delta: 0, elapsed: 0 });
		this._environment.update(SURFACE_Y - camera.position.y, 0, 10);
		await this._renderer.compileAsync(world.scene, camera);

		this._ticker.add(this.update);
		this._ticker.start();
		this.setPhase(GamePhase.INTRO);
		this.events.emit('ready', undefined);
	}

	/** Called from a user gesture: unlocks audio and starts the descent. */
	public async begin(): Promise<void> {
		await this._sound.start();
		this.restart();
	}

	/** Back to the surface for another dive. */
	public restart(): void {
		const world = this._world;

		if (!world || !this._journey) {
			return;
		}

		this._journey.restart();
		this._sound.voices.stop();
		world.reef.reset();
		world.temple.reset();
		world.atlantis.reset();
		world.passage.whale.reset();
		world.trail?.reset();
		this._environment.setIlluminated(false, true);
		this._isWhaleLeading = false;
		this._maxDepth = 0;
		this._diveSeconds = 0;
		this._fade = 0;
		this._calm = 0;
		this._storm.calm(false);
		this._surfacing = -1;
		this._wasAbove = false;
		this._sound.reset();
		this._post?.splash(false);

		if (this._camera) {
			this._camera.isSurfacing = false;
			this._camera.reachesHorizon = false;
		}

		this._scroll.enabled = true;
		this.setPhase(GamePhase.JOURNEY);
		this.events.emit('gathered', 0);
	}

	/** From the credits, just under the surface: rise through it into the sunset. */
	public surface(): void {
		const camera = this._camera;

		if (this._phase !== GamePhase.FINISHED || !camera) {
			return;
		}

		this._surfacing = 0;
		this._rise.from.copy(camera.position);
		camera.getWorldDirection(this._rise.look);
		camera.isSurfacing = true;
		camera.reachesHorizon = true;
		this.setPhase(GamePhase.SURFACED);
	}

	/** A postcard of the view as it is now, with this dive's numbers on it. */
	public async postcard(): Promise<Blob> {
		// Copied the moment it's drawn, before the browser clears the WebGL buffer
		const frame = await new Promise<HTMLCanvasElement>((resolve) =>
			this._frameRequests.push((canvas) => {
				const copy = document.createElement('canvas');
				copy.width = canvas.width;
				copy.height = canvas.height;
				copy.getContext('2d')?.drawImage(canvas, 0, 0);
				resolve(copy);
			})
		);

		return composePostcard(frame, {
			maxDepth: this._maxDepth,
			seconds: this._diveSeconds,
			lights: this._world?.trail?.gathered ?? 0
		});
	}

	/** Uses the hotspot the journey is waiting at. */
	public activateStop(): void {
		this._journey?.activate();
	}

	public toggleMute(): void {
		this.events.emit('muteChanged', this._sound.toggleMute());
	}

	public dispose(): void {
		this._ticker.dispose();
		this._unsubscribers.forEach((unsubscribe) => unsubscribe());
		this._scroll.dispose();
		this._orbit.dispose();
		this._camera?.release();
		this._lamp.dispose();
		this._viewport.dispose();
		this._world?.dispose();
		this._probe?.dispose();
		this._post?.dispose();
		this._sound.dispose();
		this._assets.dispose();
		this._renderer.dispose();
		this.events.clear();
	}

	private setPhase(phase: GamePhase): void {
		this._phase = phase;
		// The ending plays itself: no scrolling past the credits
		this._scroll.enabled = phase === GamePhase.JOURNEY;
		this.events.emit('phaseChanged', phase);
	}

	private createActions(): IJourneyActions {
		const world = (): World | null => this._world;

		return {
			receiveSignal: () => {
				world()?.reef.receiveSignal();
				this._sound.effects.discovery();
			},
			playLog: () => this._sound.effects.discovery(),
			followWhale: () => {
				this._isWhaleLeading = true;
				this._sound.effects.whaleSong(WHALE_SONG.greeting, 0.2);
			},
			wakeTemple: () => {
				world()?.temple.wake();
				this._sound.effects.rumble();
			},
			wakeCity: () => {
				world()?.atlantis.awaken();
				this._environment.setIlluminated(true);
				this._sound.effects.discovery();
				// The storm passes: by the time you surface, it's a calm sunset
				this._storm.calm();
			}
		};
	}

	private onCaption(caption: ICaption | null): void {
		if (caption?.id === '05-mara-follow-the-light') {
			this._world?.trail?.reveal(caption.from);
		}

		this.events.emit(
			'caption',
			caption ? { id: caption.id, speaker: caption.speaker ?? null, text: caption.text } : null
		);

		if (!caption?.speaker) {
			return;
		}

		if (caption.speaker === 'Kai') {
			this._sound.effects.radio();
		}

		this._sound.voices.play(caption.id, caption.speaker);
	}

	/** Mara's trail: small lights along the camera path, from her "follow the light" to the heart. */
	private trailSpots(journey: JourneyDirector): ITrailSpot[] {
		const spots: ITrailSpot[] = [];

		for (let progress = Experience.TRAIL_FROM; progress < 0.92; progress += 0.009) {
			const { position } = journey.rail.sample(progress);
			spots.push({ position: position.clone().add(new Vector3(Math.sin(progress * 90) * 0.8, -0.5, 0)), progress });
		}

		return spots;
	}

	/** Points along the whole camera path, for clearing obstacles off it. */
	private pathPoints(journey: JourneyDirector): Vector3[] {
		const points: Vector3[] = [];

		for (let progress = 0; progress <= 1; progress += 0.0015) {
			points.push(journey.rail.sample(progress).position.clone());
		}

		return points;
	}

	private readonly update = (frame: IFrameContext): void => {
		const world = this._world;
		const camera = this._camera;
		const journey = this._journey;
		const post = this._post;

		if (!world || !camera || !journey || !post) {
			return;
		}

		const pace = this._sound.voices.isSpeaking ? Experience.LISTENING_PACE : 1;
		journey.scroll(this._scroll.consume() * pace);
		journey.update(frame.delta);
		camera.isFree = journey.activeStop !== null || this._phase === GamePhase.SURFACED;
		camera.follow(this._surfacing < 0 ? journey.sample : this.rise(frame.delta), frame);
		this.breakSurface(camera.position.y > SURFACE_Y);
		this.guideWhale(journey.progress, camera);

		world.simulate(frame, camera.position, journey.progress);
		world.syncToCamera(camera, frame);

		const depth = SURFACE_Y - camera.position.y;

		if (this._phase === GamePhase.JOURNEY && depth > 0) {
			this._maxDepth = Math.max(this._maxDepth, depth);
			this._diveSeconds += frame.delta;
		}

		this._environment.update(depth, world.shelterAt(camera.position), frame.delta);
		this._lamp.update(this._environment.darkness, frame.delta);
		this._storm.update(depth, frame.delta);
		world.flash = this._storm.flash;
		this._calm = damp(this._calm, world.atlantis.isAwake ? 1 : 0, 0.25, frame.delta);
		world.surface.calm = this._calm;
		post.lamp = this._lamp.level;
		this.breathe(camera, frame.delta);
		this._sound.update(depth, world.sceneWeights(camera.position), frame.delta);
		this._quality.update(frame.delta);
		this.publishTelemetry(journey, camera, depth, frame.delta);
		this.publishHotspot(journey, camera);

		const motion = Math.min(1, (Math.abs(journey.progress - this._lastProgress) / Math.max(frame.delta, 1e-3)) * 25);
		this._lastProgress = journey.progress;
		world.snow.wake(this._lamp.level, motion, frame.delta);
		this._fade = damp(this._fade, this._phase === GamePhase.FINISHED ? 0.35 : 0, 0.6, frame.delta);
		post.air = this._wasAbove;
		post.fade = this._fade;

		const isDeepSpeaking = this._sound.voices.isSpeaking && journey.progress > 0.5 && journey.progress < 0.9;
		post.render(motion, isDeepSpeaking ? 0.25 : 0, frame);

		if (this._frameRequests.length) {
			this._frameRequests.forEach((request) => request(this._renderer.domElement));
			this._frameRequests = [];
		}
	};

	/**
	 * The way up and out: a slow rise towards the light, through the surface, then afloat on the swell,
	 * looking out at the sun going down.
	 */
	private rise(delta: number): IRailSample {
		this._surfacing += delta;

		const { from, look, position, target } = this._rise;
		const t = Math.min(1, this._surfacing / Experience.RISE_SECONDS);
		const x = from.x + SUNSET_SUN.x * Math.min(1, t * 1.2) * 4;
		const z = from.z + SUNSET_SUN.z * Math.min(1, t * 1.2) * 4;
		// Afloat, the diver rides the swell (a touch less than the water itself)
		const afloat = (this._world?.sea.heightAt(x, z) ?? SURFACE_Y) * 0.8 + Experience.AFLOAT_HEIGHT;
		const underneath = SURFACE_Y - 0.5;

		if (t < Experience.BREACH_AT) {
			// A slow glide up to just under the surface...
			const glide = t / Experience.BREACH_AT;
			position.set(x, from.y + (underneath - from.y) * glide * glide * (3 - 2 * glide), z);
		} else {
			// ...then a kick through it, bobbing up a little past where the body floats
			const pop = Math.min(1, (t - Experience.BREACH_AT) / (1 - Experience.BREACH_AT));
			const back = 1 + 2.4 * Math.pow(pop - 1, 3) + 1.4 * Math.pow(pop - 1, 2);
			position.set(x, underneath + (afloat - underneath) * back, z);
		}

		// Under, the gaze is lifted towards the bright window; out, it settles on the horizon and the sun
		const level = Math.min(1, Math.max(0, (position.y - underneath) / 1.2));
		// The first seconds turn the gaze over from wherever it was, so pressing Surface never snaps the view
		const turn = Math.min(1, t / Experience.TURN_SHARE);
		target
			.set(SUNSET_SUN.x, 0.42 - level * 0.45, SUNSET_SUN.z)
			.normalize()
			.lerp(look, 1 - turn * turn * (3 - 2 * turn))
			.normalize()
			.add(position);

		return this._rise;
	}

	/** The moment the camera breaks the surface, or slips back under it. */
	private breakSurface(isAbove: boolean): void {
		if (isAbove === this._wasAbove) {
			return;
		}

		this._wasAbove = isAbove;
		this._sound.surface(isAbove);
		this._post?.splash(isAbove);
	}

	/** The whale swims its route a little ahead of the camera, then swims on and away once the temple is in sight. */
	private guideWhale(progress: number, camera: RailCamera): void {
		const whale = this._world?.passage.whale;

		if (!whale || !this._isWhaleLeading) {
			return;
		}

		if (progress > Experience.WHALE_RELEASE) {
			if (whale.depart()) {
				this._sound.effects.whaleSong(WHALE_SONG.farewell, 0.2);
			}
		} else {
			whale.leadFrom(camera.position, Experience.WHALE_LEAD);
		}
	}

	/** Every few seconds the diver exhales a cloud of bubbles that rises past the view. */
	private breathe(camera: RailCamera, delta: number): void {
		if (this._phase !== GamePhase.JOURNEY) {
			return;
		}

		const previous = this._breath;
		this._breath = (this._breath + delta / Experience.BREATH_SECONDS) % 1;

		if (previous < 0.55 && this._breath >= 0.55) {
			camera.getWorldDirection(this._forward);
			this._projected
				.copy(camera.position)
				.addScaledVector(this._forward, 0.9)
				.add(new Vector3(0, -0.55, 0));
			this._world?.bubbles.burst(this._projected, 9);
			this._sound.effects.exhale(0.6);
		} else if (this._breath < previous) {
			this._sound.effects.inhale(0.5);
		}
	}

	/**
	 * Where the stop's hotspot is on screen. When it's out of view (looking away, or behind you) it is
	 * pinned to the screen edge in its direction, so the prompt can point the way back.
	 */
	private hotspot(journey: JourneyDirector, camera: RailCamera): IHotspotView | null {
		const stop = journey.activeStop;

		if (!stop) {
			return null;
		}

		const target = stop.hotspot();
		this._local.copy(target).sub(camera.position).applyQuaternion(camera.quaternion.clone().invert());
		this._projected.copy(target).project(camera);

		const isInFront = this._local.z < 0;
		const isVisible = isInFront && Math.abs(this._projected.x) < 0.9 && Math.abs(this._projected.y) < 0.85;
		// Behind the camera the projection flips; use the camera-space direction instead
		let x = isInFront ? this._projected.x : this._local.x;
		let y = isInFront ? this._projected.y : this._local.y;

		if (!isVisible) {
			const length = Math.hypot(x, y) || 1;
			// Keep clear of the letterbox bars and the corners
			const edge = Math.min(0.84 / Math.max(Math.abs(x / length), 1e-3), 0.6 / Math.max(Math.abs(y / length), 1e-3));
			x = (x / length) * edge;
			y = (y / length) * edge;
		}

		return { x: x * 0.5 + 0.5, y: 0.5 - y * 0.5, isVisible, angle: Math.atan2(x, y) };
	}

	/** Compass heading, degrees: north is down the canyon (-Z). */
	private heading(camera: RailCamera): number {
		camera.getWorldDirection(this._forward);

		return ((Math.atan2(this._forward.x, -this._forward.z) * 180) / Math.PI + 360) % 360;
	}

	private signal(journey: JourneyDirector, camera: RailCamera): ISignalView | null {
		const stop = journey.nextStop;

		if (!stop) {
			return null;
		}

		const target = stop.hotspot();
		// Into the camera's frame: -Z is straight ahead
		this._local.copy(target).sub(camera.position).applyQuaternion(camera.quaternion.clone().invert());

		return { bearing: Math.atan2(this._local.x, -this._local.z), distance: camera.position.distanceTo(target) };
	}

	/** Every frame while a stop waits, so the prompt sticks to its target as the diver looks around. */
	private publishHotspot(journey: JourneyDirector, camera: RailCamera): void {
		const hotspot = this.hotspot(journey, camera);

		if (hotspot || this._hadHotspot) {
			this.events.emit('hotspot', hotspot);
		}

		this._hadHotspot = hotspot !== null;
	}

	private publishTelemetry(journey: JourneyDirector, camera: RailCamera, depth: number, delta: number): void {
		this._telemetryTimer += delta;

		if (this._telemetryTimer < Experience.TELEMETRY_INTERVAL) {
			return;
		}

		this._telemetryTimer = 0;
		this.events.emit('telemetry', {
			progress: journey.progress,
			depth: Math.max(0, depth),
			// Warm at the surface, near freezing in the abyss
			temperature: Math.max(4, 26 - depth * 0.115),
			voiceLevel: this._sound.voices.level,
			heading: this.heading(camera),
			signal: this.signal(journey, camera),
			radio: Math.max(0.08, 1 - depth / 160)
		});
	}
}
