<script setup lang="ts">
import Action from '../../Atoms/Action/Action.vue';
import Text from '../../Atoms/Text/Text.vue';
import SoundBars from '../../Atoms/SoundBars/SoundBars.vue';
import type { QualityMode } from '../../../Services/Preferences.ts';

defineProps<{
	isMuted: boolean;
	quality: QualityMode;
	hasCaptions: boolean;
}>();

defineEmits<{
	toggleMute: [];
	help: [];
	cycleQuality: [];
	toggleCaptions: [];
}>();

const QUALITY_LABELS: Readonly<Record<QualityMode, string>> = { auto: 'Auto', high: 'High', low: 'Low' };
</script>

<template>
	<header class="toolbar">
		<Text tag="span" font-size="label" class="toolbar__mark">Undertow</Text>
		<div class="toolbar__actions">
			<Action variant="ghost" aria-label="Controls" @click="$emit('help')">?</Action>
			<Action
				variant="ghost"
				:aria-pressed="hasCaptions"
				title="Subtitles on or off (the voices keep playing)"
				@click="$emit('toggleCaptions')"
			>
				CC {{ hasCaptions ? 'On' : 'Off' }}
			</Action>
			<Action
				variant="ghost"
				:aria-label="`Quality: ${QUALITY_LABELS[quality]}`"
				title="Quality: Auto adapts to your device · High is sharpest (retina, crisp glow) · Low is half resolution, no glow"
				@click="$emit('cycleQuality')"
			>
				{{ QUALITY_LABELS[quality] }}
			</Action>
			<Action variant="ghost" :aria-pressed="!isMuted" @click="$emit('toggleMute')">
				<template #before><SoundBars :is-active="!isMuted" /></template>
				{{ isMuted ? 'Sound off' : 'Sound on' }}
			</Action>
		</div>
	</header>
</template>
