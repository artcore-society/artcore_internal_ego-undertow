<script setup lang="ts">
import { computed } from 'vue';
import Text from '../../Atoms/Text/Text.vue';

const props = defineProps<{
	location: string;
	depth: number;
	temperature: number;
	lights: number;
}>();

/** Metres shown above and below the current depth. */
const SPAN = 12;

const ticks = computed(() => {
	const list: { metre: number; offset: number; isMajor: boolean }[] = [];
	const first = Math.ceil(props.depth - SPAN);

	for (let metre = Math.max(0, first); metre <= props.depth + SPAN; metre++) {
		list.push({ metre, offset: (metre - props.depth) / (SPAN * 2) + 0.5, isMajor: metre % 5 === 0 });
	}

	return list;
});
</script>

<template>
	<div class="depth-gauge">
		<div class="depth-gauge__ruler" aria-hidden="true">
			<span
				v-for="tick in ticks"
				:key="tick.metre"
				class="depth-gauge__tick"
				:data-major="tick.isMajor || undefined"
				:style="{ '--offset': tick.offset }"
			>
				<Text v-if="tick.isMajor" tag="span" font-size="label" numeric class="depth-gauge__mark">{{ tick.metre }}</Text>
			</span>
			<span class="depth-gauge__pointer" />
		</div>
		<div class="depth-gauge__readout">
			<Text font-size="label" color="eyebrow">Depth</Text>
			<Text font-size="numeral" numeric glow class="depth-gauge__value">
				{{ depth.toFixed(1) }}<span class="depth-gauge__unit">m</span>
			</Text>
			<dl class="depth-gauge__stats">
				<div>
					<Text tag="dt" font-size="label" color="subtle">Temp</Text>
					<Text tag="dd" font-size="label" numeric>{{ Math.round(temperature) }}°C</Text>
				</div>
				<div>
					<Text tag="dt" font-size="label" color="subtle">Light</Text>
					<Text tag="dd" font-size="label" numeric>{{ lights }}</Text>
				</div>
			</dl>
			<Text font-size="label" color="muted" class="depth-gauge__location">{{ location || 'The surface' }}</Text>
		</div>
	</div>
</template>
