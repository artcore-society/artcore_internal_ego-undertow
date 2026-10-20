<script setup lang="ts">
defineProps<{
	isActive: boolean;
}>();
</script>

<template>
	<span class="sound-bars" :data-active="isActive || undefined" aria-hidden="true">
		<span v-for="bar in 5" :key="bar" class="sound-bars__bar" :style="{ '--bar': bar }" />
	</span>
</template>
