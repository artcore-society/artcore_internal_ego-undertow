<script setup lang="ts">
import { computed } from 'vue';
import Heading from '../../Atoms/Heading/Heading.vue';
import Text from '../../Atoms/Text/Text.vue';
import Action from '../../Atoms/Action/Action.vue';
import Wave from '../../Atoms/Wave/Wave.vue';
import type { IDiveResult } from '../../../Enums/ExperienceEvent.ts';

const props = defineProps<{
	result: Readonly<IDiveResult>;
}>();

defineEmits<{
	again: [];
	continue: [];
}>();

const duration = computed(() => {
	const minutes = Math.floor(props.result.duration / 60);
	const seconds = String(props.result.duration % 60).padStart(2, '0');

	return `${minutes}:${seconds}`;
});

const stats = computed(() => [
	{ label: 'Time below', value: duration.value },
	{ label: 'Deepest', value: `${props.result.maxDepth} m` },
	{ label: 'Lights carried', value: String(props.result.shards) },
	{ label: 'Blackouts', value: String(props.result.blackouts) }
]);
</script>

<template>
	<section class="ending-overlay">
		<div class="ending-overlay__content" data-flow>
			<Text font-size="label" color="eyebrow">The end of the descent</Text>
			<Heading :level="1" font-size="display">She kept<br />the light</Heading>
			<Wave size="l" />
			<Text font-size="lead" color="muted" class="ending-overlay__text">
				You surface at sunset, alone on a quiet sea, and for the first time in twenty years it does not feel empty.
				Somewhere far below, a city glows. It will know you when you come back.
			</Text>
			<dl class="ending-overlay__stats">
				<div v-for="stat in stats" :key="stat.label" class="ending-overlay__stat">
					<Text tag="dt" font-size="label" color="muted">{{ stat.label }}</Text>
					<Text tag="dd" font-size="h2" numeric>{{ stat.value }}</Text>
				</div>
			</dl>
			<div class="ending-overlay__actions">
				<Action arrow @click="$emit('continue')">Keep exploring</Action>
				<Action variant="button-secondary" @click="$emit('again')">Dive again</Action>
			</div>
		</div>
	</section>
</template>
