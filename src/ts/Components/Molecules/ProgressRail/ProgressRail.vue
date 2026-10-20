<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';

defineProps<{
	progress: number;
	/** Chapter numerals and where they start (0..1). */
	marks: readonly { readonly numeral: string; readonly from: number }[];
	current: string | null;
}>();
</script>

<template>
	<nav class="progress-rail" aria-label="Journey progress">
		<span class="progress-rail__line" />
		<span class="progress-rail__fill" :style="{ '--progress': progress }" />
		<span
			v-for="mark in marks"
			:key="mark.numeral"
			class="progress-rail__mark"
			:data-active="mark.numeral === current || undefined"
			:data-passed="progress >= mark.from || undefined"
			:style="{ '--at': mark.from }"
		>
			<Text tag="span" font-size="label">{{ mark.numeral }}</Text>
		</span>
		<span class="progress-rail__diver" :style="{ '--progress': progress }" />
	</nav>
</template>
