<script setup lang="ts">
import Action from '../../Atoms/Action/Action.vue';
import Text from '../../Atoms/Text/Text.vue';
import SoundBars from '../../Atoms/SoundBars/SoundBars.vue';

defineProps<{
	isMuted: boolean;
}>();

defineEmits<{
	toggleMute: [];
	help: [];
}>();
</script>

<template>
	<header class="toolbar">
		<Text tag="span" font-size="label" class="toolbar__mark">Undertow</Text>
		<div class="toolbar__actions">
			<Action variant="ghost" aria-label="Controls" @click="$emit('help')">?</Action>
			<Action variant="ghost" :aria-pressed="!isMuted" @click="$emit('toggleMute')">
				<template #before><SoundBars :is-active="!isMuted" /></template>
				{{ isMuted ? 'Sound off' : 'Sound on' }}
			</Action>
		</div>
	</header>
</template>
