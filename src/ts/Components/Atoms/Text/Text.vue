<script setup lang="ts">
import type { FontSize, TextColor } from './text.ts';

withDefaults(
	defineProps<{
		tag?: string;
		fontSize?: FontSize | undefined;
		color?: TextColor | undefined;
		numeric?: boolean;
		glow?: boolean;
		outline?: boolean;
		shadow?: boolean;
		wrap?: 'balance' | undefined;
	}>(),
	{ tag: 'p' }
);
</script>

<template>
	<component
		:is="tag"
		class="text"
		:data-font-size="fontSize"
		:data-color="color"
		:data-numeric="numeric || undefined"
		:data-glow="glow || undefined"
		:data-outline="outline || undefined"
		:data-shadow="shadow || undefined"
		:data-wrap="wrap"
	>
		<slot />
	</component>
</template>
