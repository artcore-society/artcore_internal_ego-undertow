<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Meter from '../../Atoms/Meter/Meter.vue';
import type { IObjective } from '../../../Story/Steps/IStoryStep.ts';

defineProps<{
	objective: Readonly<IObjective>;
}>();
</script>

<template>
	<section class="objective-card" data-glass data-theme="glass" data-rounded="m" data-wave aria-live="polite">
		<Text font-size="label" color="eyebrow">Objective</Text>
		<Text font-size="lead">{{ objective.title }}</Text>
		<template v-if="objective.progress">
			<Meter
				label="Objective progress"
				:value="objective.progress.current / objective.progress.total"
				:active="objective.progress.current >= objective.progress.total"
			/>
			<Text font-size="label" color="muted">{{ objective.progress.current }} / {{ objective.progress.total }}</Text>
		</template>
	</section>
</template>
