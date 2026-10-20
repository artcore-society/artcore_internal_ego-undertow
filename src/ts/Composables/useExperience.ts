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
import type { IChapterView, ICaptionView, IStopView, ITelemetry } from '../Enums/ExperienceEvent.ts';

export interface IExperienceBindings {
	readonly loading: Readonly<Ref<number>>;
	readonly phase: Readonly<Ref<GamePhase>>;
	readonly isMuted: Readonly<Ref<boolean>>;
	readonly lights: Readonly<Ref<number>>;
	readonly chapter: Readonly<Ref<DeepReadonly<IChapterView> | null>>;
	readonly caption: Readonly<Ref<DeepReadonly<ICaptionView> | null>>;
	readonly stop: Readonly<Ref<DeepReadonly<IStopView> | null>>;
	readonly telemetry: Readonly<ShallowRef<ITelemetry>>;
	/** The controls card is open. */
	readonly isHelpOpen: Readonly<Ref<boolean>>;
	begin(): void;
	restart(): void;
	activateStop(): void;
	toggleMute(): void;
	toggleHelp(open?: boolean): void;
}

const CONTROLS_SEEN_KEY = 'undertow:controls-seen';

/** Storage may be unavailable (private mode, blocked site data): then the card simply shows again. */
function hasSeenControls(): boolean {
	try {
		return localStorage.getItem(CONTROLS_SEEN_KEY) === '1';
	} catch {
		return false;
	}
}

function rememberControlsSeen(): void {
	try {
		localStorage.setItem(CONTROLS_SEEN_KEY, '1');
	} catch {
		// Not remembered; harmless
	}
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
	// Replaced wholesale 30 times a second: a shallow ref avoids deep-proxying every telemetry object
	const telemetry = shallowRef<ITelemetry>({
		progress: 0,
		depth: 0,
		temperature: 26,
		hotspot: null,
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
		events.on('phaseChanged', (value) => (phase.value = value));
		events.on('muteChanged', (value) => (isMuted.value = value));
		events.on('gathered', (value) => (lights.value = value));
		events.on('chapter', (value) => (chapter.value = value));
		events.on('caption', (value) => (caption.value = value));
		events.on('stop', (value) => (stop.value = value));
		events.on('telemetry', (value) => (telemetry.value = value));
		events.on('help', () => (isHelpOpen.value = !isHelpOpen.value));

		if (import.meta.env.DEV) {
			Object.assign(window, { experience: instance });
		}

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
		begin: () => {
			void experience.value?.begin();
			// First dive: show how it works once
			if (!hasSeenControls()) {
				isHelpOpen.value = true;
				rememberControlsSeen();
			}
		},
		restart: () => experience.value?.restart(),
		activateStop: () => experience.value?.activateStop(),
		toggleMute: () => experience.value?.toggleMute(),
		toggleHelp: (open) => (isHelpOpen.value = open ?? !isHelpOpen.value),
		isHelpOpen: readonly(isHelpOpen)
	};
}
