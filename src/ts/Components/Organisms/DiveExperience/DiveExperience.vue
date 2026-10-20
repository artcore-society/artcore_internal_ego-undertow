<script setup lang="ts">
import { computed, ref } from 'vue';
import { useExperience } from '../../../Composables/useExperience.ts';
import { GamePhase } from '../../../Enums/GamePhase.ts';
import LoadingScreen from '../LoadingScreen/LoadingScreen.vue';
import IntroOverlay from '../IntroOverlay/IntroOverlay.vue';
import JourneyOverlay from '../JourneyOverlay/JourneyOverlay.vue';
import EndingOverlay from '../EndingOverlay/EndingOverlay.vue';
import Toolbar from '../Toolbar/Toolbar.vue';
import ControlsCard from '../ControlsCard/ControlsCard.vue';

const canvas = ref<HTMLCanvasElement | null>(null);

const {
	loading,
	phase,
	isMuted,
	lights,
	chapter,
	caption,
	stop,
	telemetry,
	hotspot,
	isHelpOpen,
	begin,
	restart,
	activateStop,
	toggleMute,
	toggleHelp
} = useExperience(canvas);

/** While the dive pauses the view can be dragged around: show a hand, closed while dragging. */
const canLook = computed(() => stop.value !== null);
const isGrabbing = ref(false);
</script>

<template>
	<div
		class="dive-experience"
		:data-cinematic="stop !== null || phase === GamePhase.FINISHED || undefined"
		:data-look="canLook || undefined"
		:data-grabbing="(canLook && isGrabbing) || undefined"
		@pointerdown="isGrabbing = true"
		@pointerup="isGrabbing = false"
		@pointercancel="isGrabbing = false"
		@pointerleave="isGrabbing = false"
	>
		<canvas ref="canvas" class="dive-experience__canvas" />

		<Transition name="fade">
			<LoadingScreen v-if="phase === GamePhase.LOADING" :progress="loading" />
		</Transition>

		<Transition name="fade">
			<IntroOverlay v-if="phase === GamePhase.INTRO" @begin="begin" />
		</Transition>

		<Transition name="fade">
			<JourneyOverlay
				v-if="phase === GamePhase.JOURNEY"
				:telemetry="telemetry"
				:chapter="chapter"
				:caption="caption"
				:stop="stop"
				:hotspot="hotspot"
				:lights="lights"
				@activate="activateStop"
			/>
		</Transition>

		<Transition name="fade">
			<EndingOverlay v-if="phase === GamePhase.FINISHED" :lights="lights" @again="restart" />
		</Transition>

		<Toolbar
			v-if="phase !== GamePhase.LOADING"
			:is-muted="isMuted"
			@toggle-mute="toggleMute"
			@help="toggleHelp(true)"
		/>

		<Transition name="fade">
			<ControlsCard v-if="isHelpOpen" @close="toggleHelp(false)" />
		</Transition>
	</div>
</template>
