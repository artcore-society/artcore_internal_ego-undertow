<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import Text from '../../Atoms/Text/Text.vue';
import type { ISpokenLine } from '../../../Story/Narrator.ts';

const props = defineProps<{
	line: Readonly<ISpokenLine>;
}>();

defineEmits<{
	skip: [];
}>();

const CHARACTERS_PER_SECOND = 48;
const shown = ref('');
let frame = 0;

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
	() => props.line.id,
	() => reveal(props.line.text),
	{ immediate: true }
);

onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
	<button
		type="button"
		class="dialogue-box"
		data-glass
		data-theme="glass"
		data-rounded="m"
		data-wave
		:data-speaker="line.speaker"
		aria-live="polite"
		@mousedown.prevent
		@click="$emit('skip')"
	>
		<Text tag="span" font-size="label" color="muted" class="dialogue-box__speaker">{{ line.speaker }}</Text>
		<Text tag="span" font-size="lead" class="dialogue-box__text">{{ shown }}</Text>
	</button>
</template>
