<script setup lang="ts">
import { ref } from 'vue';
import { useExperience } from '../../../Composables/useExperience.ts';
import { GamePhase } from '../../../Enums/GamePhase.ts';
import { GameMode } from '../../../Enums/GameMode.ts';
import LoadingScreen from '../LoadingScreen/LoadingScreen.vue';
import IntroOverlay from '../IntroOverlay/IntroOverlay.vue';
import Hud from '../Hud/Hud.vue';
import ChapterCard from '../ChapterCard/ChapterCard.vue';
import BlackoutOverlay from '../BlackoutOverlay/BlackoutOverlay.vue';
import EndingOverlay from '../EndingOverlay/EndingOverlay.vue';
import Toolbar from '../Toolbar/Toolbar.vue';

const canvas = ref<HTMLCanvasElement | null>(null);

const {
	isReady,
	phase,
	mode,
	isMuted,
	shards,
	result,
	dialogue,
	objective,
	chapter,
	blackout,
	telemetry,
	begin,
	continueFreely,
	toggleMute,
	toggleFlashlight,
	skipDialogue
} = useExperience(canvas);
</script>

<template>
	<div class="dive-experience">
		<canvas ref="canvas" class="dive-experience__canvas" />

		<Transition name="fade">
			<LoadingScreen v-if="!isReady" />
		</Transition>

		<Transition name="fade">
			<IntroOverlay v-if="isReady && phase === GamePhase.INTRO" @begin="begin" />
		</Transition>

		<Transition name="fade">
			<Hud
				v-if="phase !== GamePhase.INTRO"
				:telemetry="telemetry"
				:shards="shards"
				:objective="objective"
				:dialogue="dialogue"
				:is-free="mode === GameMode.FREE"
				@skip-dialogue="skipDialogue"
			/>
		</Transition>

		<ChapterCard v-if="chapter" :key="chapter.numeral" :card="chapter" />
		<BlackoutOverlay v-if="blackout" :key="blackout.id" :message="blackout.message" />

		<Transition name="fade">
			<EndingOverlay v-if="result" :result="result" @again="begin(GameMode.STORY)" @continue="continueFreely" />
		</Transition>

		<Toolbar
			v-if="isReady"
			:is-muted="isMuted"
			:is-flashlight-on="telemetry.isFlashlightOn"
			@toggle-mute="toggleMute"
			@toggle-flashlight="toggleFlashlight"
		/>
	</div>
</template>
