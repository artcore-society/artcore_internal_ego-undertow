<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ChapterTitle from '../../Molecules/ChapterTitle/ChapterTitle.vue';
import CommsPanel from '../../Molecules/CommsPanel/CommsPanel.vue';
import CompassTape from '../../Molecules/CompassTape/CompassTape.vue';
import DepthGauge from '../../Molecules/DepthGauge/DepthGauge.vue';
import SonarRing from '../../Molecules/SonarRing/SonarRing.vue';
import ProgressRail from '../../Molecules/ProgressRail/ProgressRail.vue';
import HotspotPrompt from '../../Molecules/HotspotPrompt/HotspotPrompt.vue';
import ScrollHint from '../../Molecules/ScrollHint/ScrollHint.vue';
import Text from '../../Atoms/Text/Text.vue';
import type {
	IChapterView,
	ICaptionView,
	IHotspotView,
	IStopView,
	ITelemetry
} from '../../../Enums/ExperienceEvent.ts';

const props = defineProps<{
	telemetry: Readonly<ITelemetry>;
	chapter: Readonly<IChapterView> | null;
	caption: Readonly<ICaptionView> | null;
	stop: Readonly<IStopView> | null;
	hotspot: Readonly<IHotspotView> | null;
	lights: number;
	canSkip: boolean;
}>();

defineEmits<{
	activate: [];
	ping: [];
	jump: [from: number];
}>();

const CHAPTER_MARKS = [
	{ numeral: 'I', from: 0.04 },
	{ numeral: 'II', from: 0.2 },
	{ numeral: 'III', from: 0.34 },
	{ numeral: 'IV', from: 0.5 },
	{ numeral: 'V', from: 0.66 },
	{ numeral: 'VI', from: 0.82 }
] as const;

/**
 * The chapter card shows once, when a chapter begins (keyed, so each chapter plays its animation). A
 * stop dismisses it for good: hidden and shown again, it would replay and the title would appear twice.
 */
const card = ref<Readonly<IChapterView> | null>(null);

watch(
	() => props.chapter?.numeral,
	() => (card.value = props.chapter)
);

watch(
	() => props.stop,
	(stop) => {
		if (stop) {
			card.value = null;
		}
	}
);

const showScrollHint = computed(() => !props.stop && !props.caption && props.telemetry.progress < 0.035);
</script>

<template>
	<div class="journey-overlay" :data-cinematic="stop !== null || undefined">
		<CompassTape
			class="journey-overlay__compass"
			:heading="telemetry.heading"
			:signal="telemetry.signal?.bearing ?? null"
		/>

		<div class="journey-overlay__centre">
			<ChapterTitle v-if="card" :key="card.numeral" :chapter="card" />
		</div>

		<Transition name="fade">
			<HotspotPrompt v-if="stop" :key="stop.id" :label="stop.label" :hotspot="hotspot" @activate="$emit('activate')" />
		</Transition>

		<DepthGauge
			class="journey-overlay__depth"
			:location="chapter?.location ?? ''"
			:depth="telemetry.depth"
			:temperature="telemetry.temperature"
			:lights="lights"
		/>

		<ProgressRail
			class="journey-overlay__rail"
			:progress="telemetry.progress"
			:marks="CHAPTER_MARKS"
			:current="chapter?.numeral ?? null"
			:can-skip="canSkip"
			@jump="$emit('jump', $event)"
		/>

		<div class="journey-overlay__comms">
			<Transition name="fade">
				<CommsPanel
					v-if="caption"
					:key="caption.id"
					:caption="caption"
					:level="telemetry.voiceLevel"
					:radio="telemetry.radio"
				/>
			</Transition>
		</div>

		<SonarRing class="journey-overlay__sonar" :signal="telemetry.signal" @ping="$emit('ping')" />

		<Transition name="fade">
			<div v-if="stop" class="journey-overlay__cue">
				<Text tag="span" font-size="label" color="subtle">Drag to look around</Text>
				<Text tag="span" font-size="label" color="accent">·</Text>
				<Text tag="span" font-size="label">{{ stop.label }} to continue</Text>
			</div>
		</Transition>

		<Transition name="fade">
			<ScrollHint v-if="showScrollHint" class="journey-overlay__hint" label="Scroll, ↑ or Z to ascend" />
		</Transition>
	</div>
</template>
