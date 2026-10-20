<script setup lang="ts">
import { computed } from 'vue';
import Text from '../../Atoms/Text/Text.vue';

const props = defineProps<{
	depth: number;
	location: string;
}>();

/** The scale bottoms out at the floor of Atlantis. */
const MAX_DEPTH = 200;

const fill = computed(() => Math.min(1, Math.max(0, props.depth / MAX_DEPTH)));
</script>

<template>
	<div class="depth-gauge">
		<div class="depth-gauge__scale" aria-hidden="true">
			<span class="depth-gauge__marker" :style="{ '--depth-fill': fill }" />
		</div>
		<div class="depth-gauge__readout">
			<Text font-size="label" color="muted">Depth</Text>
			<Text font-size="numeral" numeric glow> {{ Math.round(depth) }}<span class="depth-gauge__unit">m</span> </Text>
			<Text font-size="label" color="eyebrow">{{ location }}</Text>
		</div>
	</div>
</template>
