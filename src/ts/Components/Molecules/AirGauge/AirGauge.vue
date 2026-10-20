<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Meter from '../../Atoms/Meter/Meter.vue';

defineProps<{
	level: number;
	isLow: boolean;
	isInfinite: boolean;
}>();
</script>

<template>
	<div class="air-gauge" :data-low="isLow || undefined">
		<div class="air-gauge__header">
			<Text tag="span" font-size="label" color="muted">Air</Text>
			<Text tag="span" font-size="label" numeric :color="isLow ? 'danger' : 'accent'">
				{{ isInfinite ? '∞' : `${Math.round(level * 100)}%` }}
			</Text>
		</div>
		<Meter label="Air remaining" :value="isInfinite ? 1 : level" :active="isLow" />
		<Text v-if="isLow" font-size="label" color="danger" class="air-gauge__warning">Find a bubble column</Text>
	</div>
</template>
