<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';

defineProps<{
	message: string;
}>();
</script>

<template>
	<section class="blackout-overlay" aria-live="assertive">
		<Text font-size="label" color="danger">Out of air</Text>
		<Text font-size="lead" color="muted">{{ message }}</Text>
	</section>
</template>
