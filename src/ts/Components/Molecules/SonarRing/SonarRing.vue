<script setup lang="ts">
import { computed } from 'vue';
import Text from '../../Atoms/Text/Text.vue';
import type { ISignalView } from '../../../Enums/ExperienceEvent.ts';

defineEmits<{
	ping: [];
}>();

const props = defineProps<{
	signal: Readonly<ISignalView> | null;
}>();

/** Metres at the rim of the scope; closer signals sit nearer the centre. */
const RANGE = 160;

const blip = computed(() => {
	if (!props.signal) {
		return null;
	}

	const radius = Math.min(1, Math.log1p(props.signal.distance) / Math.log1p(RANGE)) * 44;

	return {
		'--blip-x': `${50 + Math.sin(props.signal.bearing) * radius}%`,
		'--blip-y': `${50 - Math.cos(props.signal.bearing) * radius}%`
	};
});
</script>

<template>
	<button
		type="button"
		class="sonar-ring"
		:data-silent="!signal || undefined"
		aria-label="Send a sonar ping"
		title="Sonar ping (P)"
		@mousedown.prevent
		@click="$emit('ping')"
	>
		<div class="sonar-ring__scope" aria-hidden="true">
			<span class="sonar-ring__sweep" />
			<span v-if="blip" class="sonar-ring__blip" :style="blip" />
			<span class="sonar-ring__self" />
		</div>
		<div class="sonar-ring__readout">
			<Text font-size="label" color="eyebrow">Signal</Text>
			<Text font-size="label" numeric>{{ signal ? `${Math.round(signal.distance)} m` : 'Found' }}</Text>
		</div>
	</button>
</template>
