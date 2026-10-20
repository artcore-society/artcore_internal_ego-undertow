<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import KeyCap from '../../Atoms/KeyCap/KeyCap.vue';
import Action from '../../Atoms/Action/Action.vue';

defineEmits<{
	close: [];
}>();

/** Z and W are the same physical key: it works on AZERTY and QWERTY alike. */
const CONTROLS = [
	{ keys: ['Scroll', '↓', 'Z / W'], label: 'Dive deeper' },
	{ keys: ['↑', 'S'], label: 'Swim back up' },
	{ keys: ['Drag'], label: 'Look around when the dive pauses' },
	{ keys: ['Click'], label: 'Use the glowing point to go on' },
	{ keys: ['M'], label: 'Sound on / off' },
	{ keys: ['H'], label: 'Show these controls' }
] as const;
</script>

<template>
	<div
		class="controls-card"
		role="dialog"
		aria-modal="true"
		aria-labelledby="controls-card-title"
		@click.self="$emit('close')"
	>
		<section class="controls-card__panel" data-frame>
			<Text id="controls-card-title" font-size="label" color="eyebrow">How to dive</Text>
			<ul class="controls-card__list">
				<li v-for="control in CONTROLS" :key="control.label" class="controls-card__row">
					<span class="controls-card__keys">
						<KeyCap v-for="key in control.keys" :key="key" :label="key" />
					</span>
					<Text tag="span" color="muted">{{ control.label }}</Text>
				</li>
			</ul>
			<Text font-size="label" color="subtle"
				>The dive pauses at five moments in the story. Look around, then use the light.</Text
			>
			<Action @click="$emit('close')">Got it</Action>
		</section>
	</div>
</template>
