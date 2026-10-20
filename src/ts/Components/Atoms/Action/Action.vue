<script setup lang="ts">
import Text from '../Text/Text.vue';

const props = withDefaults(
	defineProps<{
		variant?: 'frame' | 'solid' | 'ghost';
	}>(),
	{ variant: 'frame' }
);

defineEmits<{
	click: [];
}>();
</script>

<template>
	<button
		type="button"
		class="action"
		:data-variant="variant"
		:data-frame="props.variant === 'frame' || undefined"
		@mousedown.prevent
		@click="$emit('click')"
	>
		<slot name="before" />
		<Text tag="span" font-size="button">
			<slot />
		</Text>
		<slot name="after" />
	</button>
</template>
