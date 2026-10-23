<script setup lang="ts">
import Action from '../../Atoms/Action/Action.vue';
import Text from '../../Atoms/Text/Text.vue';
import SoundBars from '../../Atoms/SoundBars/SoundBars.vue';
import type { CaptionMode, QualityMode } from '../../../Services/Preferences.ts';

defineProps<{
	isMuted: boolean;
	quality: QualityMode;
	captions: CaptionMode;
}>();

defineEmits<{
	toggleMute: [];
	help: [];
	cycleQuality: [];
	cycleCaptions: [];
}>();

const QUALITY_LABELS: Readonly<Record<QualityMode, string>> = { auto: 'Auto', high: 'High', low: 'Low' };
const CAPTION_LABELS: Readonly<Record<CaptionMode, string>> = { always: 'On', muted: 'Muted', never: 'Off' };
</script>

<template>
	<header class="toolbar">
		<Text tag="span" font-size="label" class="toolbar__mark">Undertow</Text>
		<div class="toolbar__actions">
			<Action variant="ghost" aria-label="Controls" @click="$emit('help')">?</Action>
			<Action
				variant="ghost"
				:aria-label="`Captions: ${CAPTION_LABELS[captions]}`"
				title="Captions: always, only when the sound is off, or never"
				@click="$emit('cycleCaptions')"
			>
				CC {{ CAPTION_LABELS[captions] }}
			</Action>
			<Action
				variant="ghost"
				:aria-label="`Quality: ${QUALITY_LABELS[quality]}`"
				title="Quality: automatic, always high, or low for older devices"
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
