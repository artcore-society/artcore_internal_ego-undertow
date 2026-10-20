<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Text from '../../Atoms/Text/Text.vue';
import SpeakerAvatar from '../SpeakerAvatar/SpeakerAvatar.vue';
import type { ICaptionView } from '../../../Enums/ExperienceEvent.ts';
import type { Speaker } from '../../../Journey/IJourney.ts';

const props = defineProps<{
	caption: Readonly<ICaptionView>;
	/** 0..1 voice loudness. */
	level: number;
	/** 0..1 boat radio strength. */
	radio: number;
}>();

/** What each voice comes in on. */
const CHANNELS: Readonly<Record<Speaker, string>> = {
	Kai: 'Ch 16 · Boat radio',
	Mara: 'Rec · Mara Vale, field log',
	You: 'Mask mic',
	'The Deep': 'Unknown source · 18 Hz'
};

/** Fixed per-bar variation so the waveform looks like speech, not a meter. */
const WAVE = [0.4, 0.75, 0.55, 1, 0.65, 0.85, 0.35, 0.9, 0.5, 0.7, 0.45, 0.8, 0.3, 0.6, 0.95, 0.5];

const CHARACTERS_PER_SECOND = 42;
const shown = ref('');
let frame = 0;

const bars = computed(() => (props.caption.speaker === 'Kai' ? Math.max(1, Math.round(props.radio * 4)) : 4));

/** Typewriter reveal of each new line. */
function reveal(text: string): void {
	cancelAnimationFrame(frame);
	const start = performance.now();

	const tick = (now: number): void => {
		const count = Math.floor(((now - start) / 1000) * CHARACTERS_PER_SECOND);
		shown.value = text.slice(0, count);

		if (count < text.length) {
			frame = requestAnimationFrame(tick);
		}
	};

	frame = requestAnimationFrame(tick);
}

watch(
	() => props.caption.id,
	() => reveal(props.caption.text),
	{ immediate: true }
);

onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
	<section class="comms-panel" :data-speaker="caption.speaker" aria-live="polite">
		<SpeakerAvatar v-if="caption.speaker" :speaker="caption.speaker" :level="level" />
		<div class="comms-panel__body">
			<header v-if="caption.speaker" class="comms-panel__header">
				<Text tag="span" font-size="label" class="comms-panel__name">{{ caption.speaker }}</Text>
				<Text tag="span" font-size="label" color="subtle">{{ CHANNELS[caption.speaker] }}</Text>
				<span class="comms-panel__bars" aria-hidden="true">
					<span v-for="bar in 4" :key="bar" :data-on="bar <= bars || undefined" />
				</span>
			</header>
			<Text font-size="caption" class="comms-panel__text" shadow>
				{{ shown }}<span class="comms-panel__ghost">{{ caption.text.slice(shown.length) }}</span>
			</Text>
			<span class="comms-panel__wave" aria-hidden="true">
				<span v-for="(height, index) in WAVE" :key="index" :style="{ '--bar': height * level }" />
			</span>
		</div>
	</section>
</template>
