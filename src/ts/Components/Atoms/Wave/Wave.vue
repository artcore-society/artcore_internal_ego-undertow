<script setup lang="ts">
defineProps<{
	size?: 'l';
}>();
</script>

<template>
	<span class="wave" :data-size="size" aria-hidden="true" />
</template>
