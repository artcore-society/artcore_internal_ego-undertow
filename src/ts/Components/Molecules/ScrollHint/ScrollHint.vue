<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';

defineProps<{
	label: string;
}>();
</script>

<template>
	<div class="scroll-hint" aria-hidden="true">
		<Text font-size="label" color="muted" shadow>{{ label }}</Text>
		<span class="scroll-hint__line" />
	</div>
</template>
