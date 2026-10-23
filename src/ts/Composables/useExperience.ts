import {
	onBeforeUnmount,
	onMounted,
	readonly,
	ref,
	shallowRef,
	type DeepReadonly,
	type Ref,
	type ShallowRef
} from 'vue';
import Experience from '../Core/Experience.ts';
import { GamePhase } from '../Enums/GamePhase.ts';
import { downloadPostcard } from '../Services/Postcard.ts';
import {
	CAPTION_MODES,
	QUALITY_MODES,
	preferences,
	type CaptionMode,
	type QualityMode
} from '../Services/Preferences.ts';
import type { IChapterView, ICaptionView, IHotspotView, IStopView, ITelemetry } from '../Enums/ExperienceEvent.ts';

export interface IExperienceBindings {
	readonly loading: Readonly<Ref<number>>;
	readonly phase: Readonly<Ref<GamePhase>>;
	readonly isMuted: Readonly<Ref<boolean>>;
	readonly lights: Readonly<Ref<number>>;
	readonly chapter: Readonly<Ref<DeepReadonly<IChapterView> | null>>;
	readonly caption: Readonly<Ref<DeepReadonly<ICaptionView> | null>>;
	readonly stop: Readonly<Ref<DeepReadonly<IStopView> | null>>;
	readonly telemetry: Readonly<ShallowRef<ITelemetry>>;
	/** The waiting stop's hotspot on screen, updated every frame. */
	readonly hotspot: Readonly<ShallowRef<IHotspotView | null>>;
	/** The controls card is open. */
	readonly isHelpOpen: Readonly<Ref<boolean>>;
	begin(): void;
	restart(): void;
	activateStop(): void;
	/** From the credits, up through the surface into the sunset. */
	surface(): void;
	toggleMute(): void;
	toggleHelp(open?: boolean): void;
	/** Downloads a postcard of the view with this dive's numbers. */
	savePostcard(): Promise<void>;
	/** Sends a sonar ping out through the water. */
	ping(): void;
	readonly quality: Readonly<Ref<QualityMode>>;
	readonly captions: Readonly<Ref<CaptionMode>>;
	/** Someone who has been all the way down before (they may skip chapters; the deep remembers them). */
	readonly isReturning: Readonly<Ref<boolean>>;
	cycleQuality(): void;
	cycleCaptions(): void;
	/** Cuts to a chapter, from its start (0..1). */
	jumpTo(progress: number): void;
}

/** The next option after `value`, wrapping round. */
function next<TValue>(options: readonly TValue[], value: TValue): TValue {
	return options[(options.indexOf(value) + 1) % options.length] ?? value;
}

/** Bridges the imperative three.js experience to reactive Vue state. */
export function useExperience(canvas: Ref<HTMLCanvasElement | null>): IExperienceBindings {
	const experience = shallowRef<Experience | null>(null);
	const loading = ref(0);
	const phase = ref<GamePhase>(GamePhase.LOADING);
	const isMuted = ref(false);
	const lights = ref(0);
	const chapter = ref<IChapterView | null>(null);
	const caption = ref<ICaptionView | null>(null);
	const stop = ref<IStopView | null>(null);
	const isHelpOpen = ref(false);
	const quality = ref<QualityMode>(preferences.quality());
	const captions = ref<CaptionMode>(preferences.captions());
	const isReturning = ref(preferences.dives() > 0);
	const hotspot = shallowRef<IHotspotView | null>(null);
	// Replaced wholesale 30 times a second: a shallow ref avoids deep-proxying every telemetry object
	const telemetry = shallowRef<ITelemetry>({
		progress: 0,
		depth: 0,
		temperature: 26,
		voiceLevel: 0,
		heading: 0,
		signal: null,
		radio: 1
	});

	onMounted(async () => {
		if (!canvas.value) {
			return;
		}

		const instance = new Experience(canvas.value);
		const { events } = instance;

		events.on('loading', (value) => (loading.value = value.ratio));
		events.on('phaseChanged', (value) => {
			phase.value = value;

			// All the way down: remembered from now on
			if (value === GamePhase.FINISHED) {
				preferences.addDive();
				isReturning.value = true;
			}
		});
		events.on('muteChanged', (value) => (isMuted.value = value));
		events.on('gathered', (value) => (lights.value = value));
		events.on('chapter', (value) => (chapter.value = value));
		events.on('caption', (value) => (caption.value = value));
		events.on('stop', (value) => (stop.value = value));
		events.on('telemetry', (value) => (telemetry.value = value));
		events.on('hotspot', (value) => (hotspot.value = value));
		events.on('help', () => (isHelpOpen.value = !isHelpOpen.value));

		if (import.meta.env.DEV) {
			Object.assign(window, { experience: instance });
		}

		instance.setQuality(quality.value);
		instance.isRemembered = isReturning.value;
		experience.value = instance;
		await instance.boot();
	});

	onBeforeUnmount(() => {
		experience.value?.dispose();
		experience.value = null;
	});

	return {
		loading: readonly(loading),
		phase: readonly(phase),
		isMuted: readonly(isMuted),
		lights: readonly(lights),
		chapter: readonly(chapter),
		caption: readonly(caption),
		stop: readonly(stop),
		telemetry,
		hotspot,
		surface: () => experience.value?.surface(),
		begin: () => {
			void experience.value?.begin();
			// First dive: show how it works once
			if (!preferences.hasSeenControls()) {
				isHelpOpen.value = true;
				preferences.rememberControlsSeen();
			}
		},
		restart: () => experience.value?.restart(),
		activateStop: () => experience.value?.activateStop(),
		toggleMute: () => experience.value?.toggleMute(),
		toggleHelp: (open) => (isHelpOpen.value = open ?? !isHelpOpen.value),
		ping: () => experience.value?.ping(),
		quality: readonly(quality),
		captions: readonly(captions),
		isReturning: readonly(isReturning),
		cycleQuality: () => {
			quality.value = next(QUALITY_MODES, quality.value);
			preferences.setQuality(quality.value);
			experience.value?.setQuality(quality.value);
		},
		cycleCaptions: () => {
			captions.value = next(CAPTION_MODES, captions.value);
			preferences.setCaptions(captions.value);
		},
		jumpTo: (progress) => experience.value?.jumpTo(progress),
		savePostcard: async () => {
			const blob = await experience.value?.postcard();

			if (blob) {
				downloadPostcard(blob);
			}
		},
		isHelpOpen: readonly(isHelpOpen)
	};
}
