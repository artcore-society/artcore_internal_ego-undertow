<script setup lang="ts">
import KeyCap from '../../Atoms/KeyCap/KeyCap.vue';
import Text from '../../Atoms/Text/Text.vue';

const CONTROLS = [
	{ keys: ['W', 'A', 'S', 'D'], label: 'Swim & turn' },
	{ keys: ['Space', 'C'], label: 'Rise & sink' },
	{ keys: ['Shift'], label: 'Kick hard (uses air)' },
	{ keys: ['F'], label: 'Head lamp' },
	{ keys: ['Drag'], label: 'Look around' }
] as const;
</script>

<template>
	<ul class="controls-legend">
		<li v-for="control in CONTROLS" :key="control.label" class="controls-legend__item">
			<span class="controls-legend__keys">
				<KeyCap v-for="key in control.keys" :key="key" :label="key" />
			</span>
			<Text tag="span" color="muted">{{ control.label }}</Text>
		</li>
	</ul>
</template>
