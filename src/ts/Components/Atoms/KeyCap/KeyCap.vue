<script setup lang="ts">
defineProps<{
	label: string;
	size?: 's';
}>();
</script>

<template>
	<kbd class="key-cap" :data-size="size">{{ label }}</kbd>
</template>
