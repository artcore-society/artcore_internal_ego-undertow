<script setup lang="ts">
import { computed } from 'vue';
import Text from '../Text/Text.vue';
import type { FontSize, TextColor } from '../Text/text.ts';

const props = withDefaults(
	defineProps<{
		level?: 1 | 2 | 3;
		fontSize?: FontSize | undefined;
		color?: TextColor | undefined;
		glow?: boolean;
	}>(),
	{ level: 2 }
);

const DEFAULT_SIZES: Record<1 | 2 | 3, FontSize> = { 1: 'h1', 2: 'h2', 3: 'lead' };

const size = computed<FontSize>(() => props.fontSize ?? DEFAULT_SIZES[props.level]);
</script>

<template>
	<Text :tag="`h${level}`" class="heading" :font-size="size" :color="color" :glow="glow" wrap="balance">
		<slot />
	</Text>
</template>
