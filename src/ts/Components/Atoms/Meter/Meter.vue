<script setup lang="ts">
defineProps<{
	value: number;
	label: string;
	active?: boolean;
}>();
</script>

<template>
	<div
		class="meter"
		role="meter"
		:aria-label="label"
		aria-valuemin="0"
		aria-valuemax="1"
		:aria-valuenow="value"
		:data-active="active || undefined"
	>
		<div class="meter__fill" :style="{ '--meter-value': value }" />
	</div>
</template>
