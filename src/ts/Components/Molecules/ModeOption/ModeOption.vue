<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';

defineProps<{
	title: string;
	description: string;
	primary?: boolean;
}>();

defineEmits<{
	select: [];
}>();
</script>

<template>
	<button
		type="button"
		class="mode-option"
		data-glass
		data-theme="glass"
		data-rounded="m"
		:data-primary="primary || undefined"
		:data-wave="primary || undefined"
		@mousedown.prevent
		@click="$emit('select')"
	>
		<Text tag="span" font-size="h2">{{ title }}</Text>
		<Text tag="span" color="muted">{{ description }}</Text>
	</button>
</template>
