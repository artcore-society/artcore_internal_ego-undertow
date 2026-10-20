<script setup lang="ts">
defineProps<{
	value: number;
	label: string;
}>();
</script>

<template>
	<div
		class="progress-bar"
		role="progressbar"
		:aria-label="label"
		aria-valuemin="0"
		aria-valuemax="1"
		:aria-valuenow="value"
	>
		<div class="progress-bar__fill" :style="{ '--progress': value }" />
	</div>
</template>
