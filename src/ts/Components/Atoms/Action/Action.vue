<script setup lang="ts">
import Text from '../Text/Text.vue';

const props = withDefaults(
	defineProps<{
		variant?: 'button' | 'button-secondary' | 'glass';
		arrow?: boolean;
	}>(),
	{ variant: 'button' }
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
		:data-glass="props.variant === 'glass' || undefined"
		:data-theme="props.variant === 'glass' ? 'glass' : undefined"
		@mousedown.prevent
		@click="$emit('click')"
	>
		<Text tag="span" :font-size="variant === 'glass' ? 'body' : 'button'">
			<slot />
		</Text>
		<slot name="after" />
		<span v-if="arrow" class="action__arrow" aria-hidden="true">→</span>
	</button>
</template>
