<script setup lang="ts">
import Action from '../../Atoms/Action/Action.vue';
import KeyCap from '../../Atoms/KeyCap/KeyCap.vue';

defineProps<{
	isMuted: boolean;
	isFlashlightOn: boolean;
}>();

defineEmits<{
	toggleFlashlight: [];
	toggleMute: [];
}>();
</script>

<template>
	<nav class="toolbar" aria-label="Dive controls">
		<Action variant="glass" @click="$emit('toggleFlashlight')">
			{{ isFlashlightOn ? 'Lamp on' : 'Lamp off' }}
			<template #after><KeyCap label="F" size="s" /></template>
		</Action>
		<Action variant="glass" @click="$emit('toggleMute')">
			{{ isMuted ? 'Sound off' : 'Sound on' }}
			<template #after><KeyCap label="M" size="s" /></template>
		</Action>
	</nav>
</template>
