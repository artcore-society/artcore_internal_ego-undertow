<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import DepthGauge from '../../Molecules/DepthGauge/DepthGauge.vue';
import AirGauge from '../../Molecules/AirGauge/AirGauge.vue';
import SignalIndicator from '../../Molecules/SignalIndicator/SignalIndicator.vue';
import ObjectiveCard from '../../Molecules/ObjectiveCard/ObjectiveCard.vue';
import DialogueBox from '../../Molecules/DialogueBox/DialogueBox.vue';
import type { ITelemetry } from '../../../Enums/ExperienceEvent.ts';
import type { ISpokenLine } from '../../../Story/Narrator.ts';
import type { IObjective } from '../../../Story/Steps/IStoryStep.ts';

defineProps<{
	telemetry: Readonly<ITelemetry>;
	shards: number;
	objective: Readonly<IObjective> | null;
	dialogue: Readonly<ISpokenLine> | null;
	isFree: boolean;
}>();

defineEmits<{
	skipDialogue: [];
}>();
</script>

<template>
	<div class="hud" :data-hypoxia="telemetry.isLowOxygen || undefined">
		<DepthGauge class="hud__depth" :depth="telemetry.depth" :location="telemetry.location" />

		<SignalIndicator v-if="telemetry.signal" :signal="telemetry.signal" />

		<Transition name="fade">
			<ObjectiveCard v-if="objective" :key="objective.title" class="hud__objective" :objective="objective" />
		</Transition>

		<Transition name="fade">
			<DialogueBox v-if="dialogue" class="hud__dialogue" :line="dialogue" @skip="$emit('skipDialogue')" />
		</Transition>

		<div class="hud__instruments" data-glass data-theme="glass" data-rounded="l" data-wave>
			<AirGauge :level="telemetry.oxygen" :is-low="telemetry.isLowOxygen" :is-infinite="isFree" />
			<div class="hud__shards">
				<Text :key="shards" tag="span" font-size="h1" numeric glow class="hud__shard-count">{{ shards }}</Text>
				<Text tag="span" font-size="label" color="muted">Lights</Text>
			</div>
		</div>
	</div>
</template>
