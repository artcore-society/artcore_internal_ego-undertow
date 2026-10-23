<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import { computed } from 'vue';
import ProgressBar from '../../Atoms/ProgressBar/ProgressBar.vue';
import { NARRATION } from '../../../Journey/narration.ts';

const props = defineProps<{
	progress: number;
}>();

/** Mara's first log types itself out as the dive loads: the story starts before the water does. */
const LOG = NARRATION.find((line) => line.id === '04-mara-log-one')?.text ?? '';
const typed = computed(() => Math.round(LOG.length * Math.min(1, props.progress * 1.15)));
</script>

<template>
	<div class="loading-screen" role="status">
		<Text font-size="display" outline class="loading-screen__title">Undertow</Text>
		<figure class="loading-screen__log">
			<Text tag="figcaption" font-size="label" color="eyebrow">Rec · Mara Vale, field log</Text>
			<Text tag="blockquote" font-size="caption" color="muted">
				{{ LOG.slice(0, typed) }}<span class="loading-screen__ghost">{{ LOG.slice(typed) }}</span>
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
