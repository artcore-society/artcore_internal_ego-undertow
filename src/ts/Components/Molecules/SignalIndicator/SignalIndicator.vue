<script setup lang="ts">
import { computed } from 'vue';
import Text from '../../Atoms/Text/Text.vue';
import type { ISignalBearing } from '../../../Enums/ExperienceEvent.ts';

const props = defineProps<{
	signal: Readonly<ISignalBearing>;
}>();

/** Off screen, the arrow rides an ellipse around the frame towards the signal. */
const style = computed(() => ({
	'--signal-x': `${50 + Math.sin(props.signal.angle) * 44}%`,
	'--signal-y': `${50 - Math.cos(props.signal.angle) * 40}%`,
	'--signal-angle': `${props.signal.angle}rad`
}));
</script>

<template>
	<div class="signal-indicator" :data-visible="signal.isVisible || undefined" :style="style" aria-hidden="true">
		<span class="signal-indicator__arrow" />
		<Text tag="span" font-size="label" color="accent" numeric>{{ Math.round(signal.distance) }} m</Text>
	</div>
</template>
