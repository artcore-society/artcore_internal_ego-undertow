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

/** On the thing itself when it's in view, otherwise centred low on screen. */
const style = computed(() => {
	const hotspot = props.hotspot;

	return hotspot?.isVisible ? { '--hotspot-x': `${hotspot.x * 100}%`, '--hotspot-y': `${hotspot.y * 100}%` } : {};
});
</script>

<template>
	<div class="hotspot-prompt" :data-anchored="hotspot?.isVisible || undefined" :style="style">
		<button type="button" class="hotspot-prompt__button" @mousedown.prevent @click="$emit('activate')">
			<Pulse />
			<Text tag="span" font-size="button" class="hotspot-prompt__label" shadow>{{ label }}</Text>
		</button>
	</div>
</template>
