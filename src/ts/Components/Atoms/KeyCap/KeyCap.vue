<script setup lang="ts">
defineProps<{
	label: string;
}>();
</script>

<template>
	<kbd class="key-cap">{{ label }}</kbd>
</template>
