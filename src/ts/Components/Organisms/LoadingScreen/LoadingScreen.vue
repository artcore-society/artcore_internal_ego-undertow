<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import { computed } from 'vue';
import ProgressBar from '../../Atoms/ProgressBar/ProgressBar.vue';

const props = defineProps<{
	progress: number;
}>();

/**
 * The boat's receiver picking up her beacon, typing itself out as the dive loads: the story starts
 * before the water does. Never spoken in the dive, so nothing is given away or heard twice.
 */
const LINES = ['Beacon MV-1 · signal re-acquired', '20 years since last contact · depth unknown'];
const LENGTH = LINES.reduce((total, line) => total + line.length, 0);

/** How much of each line has typed out: the first line, then the second. */
const typed = computed(() => {
	let left = Math.round(LENGTH * Math.min(1, props.progress * 1.15));

	return LINES.map((line) => {
		const count = Math.min(line.length, left);
		left -= count;

		return count;
	});
});
</script>

<template>
	<div class="loading-screen" role="status">
		<Text font-size="display" outline class="loading-screen__title">Undertow</Text>
		<figure class="loading-screen__log">
			<Text tag="figcaption" font-size="label" color="eyebrow">Ch 16 · Incoming</Text>
			<Text v-for="(line, index) in LINES" :key="line" tag="p" font-size="label" color="muted">
				{{ line.slice(0, typed[index]) }}<span class="loading-screen__ghost">{{ line.slice(typed[index]) }}</span>
			</Text>
		</figure>
		<div class="loading-screen__progress">
			<ProgressBar :value="progress" label="Loading the deep" />
			<div class="loading-screen__status">
				<Text tag="span" font-size="label" color="muted">Pressurising</Text>
				<Text tag="span" font-size="label" numeric>{{ Math.round(progress * 100) }}%</Text>
			</div>
		</div>
	</div>
</template>
