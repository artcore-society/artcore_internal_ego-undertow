<script setup lang="ts">
import { computed } from 'vue';
import Text from '../../Atoms/Text/Text.vue';

const props = defineProps<{
	heading: number;
	/** Bearing of Mara's signal relative to the view, radians, or null. */
	signal: number | null;
}>();

/** Degrees visible either side of the centre. */
const SPAN = 60;
const CARDINALS: Readonly<Record<number, string>> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

const ticks = computed(() => {
	const first = Math.ceil((props.heading - SPAN) / 5) * 5;
	const list: { key: number; offset: number; label: string | null; isMajor: boolean }[] = [];

	for (let degree = first; degree <= props.heading + SPAN; degree += 5) {
		const normal = ((degree % 360) + 360) % 360;
		const isMajor = normal % 15 === 0;

		list.push({
			key: degree,
			offset: (degree - props.heading) / (SPAN * 2) + 0.5,
			label: normal % 30 === 0 ? (CARDINALS[normal] ?? String(normal)) : null,
			isMajor
		});
	}

	return list;
});

const signalOffset = computed(() => {
	if (props.signal === null) {
		return null;
	}

	const degrees = (props.signal * 180) / Math.PI;

	return Math.abs(degrees) <= SPAN ? degrees / (SPAN * 2) + 0.5 : null;
});
</script>

<template>
	<div class="compass-tape" aria-hidden="true">
		<div class="compass-tape__scale">
			<span
				v-for="tick in ticks"
				:key="tick.key"
				class="compass-tape__tick"
				:data-major="tick.isMajor || undefined"
				:style="{ '--offset': tick.offset }"
			>
				<Text v-if="tick.label" tag="span" font-size="label" class="compass-tape__label">{{ tick.label }}</Text>
			</span>
			<span v-if="signalOffset !== null" class="compass-tape__signal" :style="{ '--offset': signalOffset }" />
		</div>
		<span class="compass-tape__needle" />
		<Text tag="span" font-size="label" numeric class="compass-tape__heading"
			>{{ String(Math.round(heading) % 360).padStart(3, '0') }}°</Text
		>
	</div>
</template>
