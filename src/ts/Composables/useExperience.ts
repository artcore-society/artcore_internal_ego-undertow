import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, type DeepReadonly, type Ref } from 'vue';
import Experience from '../Core/Experience.ts';
import { GamePhase } from '../Enums/GamePhase.ts';
import { GameMode } from '../Enums/GameMode.ts';
import type { IDiveResult, ITelemetry } from '../Enums/ExperienceEvent.ts';
import type { ISpokenLine } from '../Story/Narrator.ts';
import type { IObjective } from '../Story/Steps/IStoryStep.ts';
import type { IChapterCard } from '../Story/IChapter.ts';

export interface IBlackout {
	readonly id: number;
	readonly message: string;
}

export interface IExperienceBindings {
	readonly isReady: Readonly<Ref<boolean>>;
	readonly phase: Readonly<Ref<GamePhase>>;
	readonly mode: Readonly<Ref<GameMode>>;
	readonly isMuted: Readonly<Ref<boolean>>;
	readonly shards: Readonly<Ref<number>>;
	readonly result: Readonly<Ref<DeepReadonly<IDiveResult> | null>>;
	readonly dialogue: Readonly<Ref<DeepReadonly<ISpokenLine> | null>>;
	readonly objective: Readonly<Ref<DeepReadonly<IObjective> | null>>;
	readonly chapter: Readonly<Ref<DeepReadonly<IChapterCard> | null>>;
	readonly blackout: Readonly<Ref<DeepReadonly<IBlackout> | null>>;
	readonly telemetry: Readonly<Ref<DeepReadonly<ITelemetry>>>;
	begin(mode: GameMode): void;
	continueFreely(): void;
	toggleMute(): void;
	toggleFlashlight(): void;
	skipDialogue(): void;
}

/** Bridges the imperative three.js experience to reactive Vue state. */
export function useExperience(canvas: Ref<HTMLCanvasElement | null>): IExperienceBindings {
	const experience = shallowRef<Experience | null>(null);
	const isReady = ref(false);
	const phase = ref<GamePhase>(GamePhase.INTRO);
	const mode = ref<GameMode>(GameMode.STORY);
	const isMuted = ref(false);
	const shards = ref(0);
	const result = ref<IDiveResult | null>(null);
	const dialogue = ref<ISpokenLine | null>(null);
	const objective = ref<IObjective | null>(null);
	const chapter = ref<IChapterCard | null>(null);
	const blackout = ref<IBlackout | null>(null);
	// Replaced wholesale ten times a second: a shallow ref avoids deep-proxying every telemetry object
	const telemetry = shallowRef<ITelemetry>({
		depth: 0,
		oxygen: 1,
		isLowOxygen: false,
		isSprinting: false,
		isFlashlightOn: false,
		signal: null,
		location: ''
	});
	let sequence = 0;

	onMounted(async () => {
		if (!canvas.value) {
			return;
		}

		const instance = new Experience(canvas.value);
		const { events } = instance;

		events.on('ready', () => (isReady.value = true));
		events.on('phaseChanged', (value) => (phase.value = value));
		events.on('modeChanged', (value) => (mode.value = value));
		events.on('muteChanged', (value) => (isMuted.value = value));
		events.on('shardsChanged', (value) => (shards.value = value));
		events.on('finished', (value) => (result.value = value));
		events.on('telemetry', (value) => (telemetry.value = value));
		events.on('dialogue', (value) => (dialogue.value = value));
		events.on('objective', (value) => (objective.value = value));
		events.on('chapter', (value) => (chapter.value = value));
		events.on('blackout', (message) => (blackout.value = { id: ++sequence, message }));

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
		isReady: readonly(isReady),
		phase: readonly(phase),
		mode: readonly(mode),
		isMuted: readonly(isMuted),
		shards: readonly(shards),
		result: readonly(result),
		dialogue: readonly(dialogue),
		objective: readonly(objective),
		chapter: readonly(chapter),
		blackout: readonly(blackout),
		telemetry,
		begin: (selected) => {
			result.value = null;
			objective.value = null;
			chapter.value = null;
			void experience.value?.begin(selected);
		},
		continueFreely: () => {
			result.value = null;
			experience.value?.continueFreely();
		},
		toggleMute: () => experience.value?.toggleMute(),
		toggleFlashlight: () => experience.value?.toggleFlashlight(),
		skipDialogue: () => experience.value?.skipDialogue()
	};
}
