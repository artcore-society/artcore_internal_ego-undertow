<script setup lang="ts">
import { computed } from 'vue';
import Text from '../../Atoms/Text/Text.vue';
import Pulse from '../../Atoms/Pulse/Pulse.vue';
import type { IHotspotView } from '../../../Enums/ExperienceEvent.ts';

const props = defineProps<{
	label: string;
	hotspot: Readonly<IHotspotView> | null;
}>();

defineEmits<{
	activate: [];
}>();

/** Pinned to the hotspot every frame; out of view it waits at the screen edge, pointing the way back. */
const style = computed(() => {
	const hotspot = props.hotspot;

	return hotspot
		? { left: `${hotspot.x * 100}%`, top: `${hotspot.y * 100}%`, '--hotspot-angle': `${hotspot.angle}rad` }
		: {};
});
</script>

<template>
	<div v-if="hotspot" class="hotspot-prompt" :data-off-screen="!hotspot.isVisible || undefined" :style="style">
		<button
			v-if="hotspot.isVisible"
			type="button"
			class="hotspot-prompt__button"
			@mousedown.prevent.stop
			@click="$emit('activate')"
		>
			<Pulse />
			<Text tag="span" font-size="button" class="hotspot-prompt__label" shadow>{{ label }}</Text>
		</button>
		<div v-else class="hotspot-prompt__pointer" aria-hidden="true">
			<span class="hotspot-prompt__arrow" />
			<Text tag="span" font-size="label" class="hotspot-prompt__hint" shadow>This way</Text>
		</div>
	</div>
</template>
