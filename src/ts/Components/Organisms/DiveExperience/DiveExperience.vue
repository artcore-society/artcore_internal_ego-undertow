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
	surface,
	toggleMute,
	toggleHelp,
	savePostcard,
	ping,
	quality,
	captions,
	isReturning,
	cycleQuality,
	cycleCaptions,
	jumpTo
} = useExperience(canvas);

/** Captions as chosen: always, only while the sound is off, or never (the voices still play). */
const shownCaption = computed(() =>
	captions.value === 'always' || (captions.value === 'muted' && isMuted.value) ? caption.value : null
);

const isEnding = computed(() => phase.value === GamePhase.FINISHED || phase.value === GamePhase.SURFACED);
/** While the dive pauses (and on the sea at the end) the view can be dragged around: an open hand, closed while dragging. */
const canLook = computed(() => stop.value !== null || phase.value === GamePhase.SURFACED);
const isGrabbing = ref(false);
</script>

<template>
	<div
		class="dive-experience"
		:data-cinematic="stop !== null || isEnding || undefined"
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
			<IntroOverlay v-if="phase === GamePhase.INTRO" :is-returning="isReturning" @begin="begin" />
		</Transition>

		<Transition name="fade">
			<JourneyOverlay
				v-if="phase === GamePhase.JOURNEY"
				:telemetry="telemetry"
				:chapter="chapter"
				:caption="shownCaption"
				:stop="stop"
				:hotspot="hotspot"
				:lights="lights"
				:can-skip="isReturning"
				@activate="activateStop"
				@ping="ping"
				@jump="jumpTo"
			/>
		</Transition>

		<Transition name="fade">
			<EndingOverlay
				v-if="isEnding"
				:lights="lights"
				:is-surfaced="phase === GamePhase.SURFACED"
				@continue="surface"
				@again="restart"
				@postcard="savePostcard"
			/>
		</Transition>

		<Toolbar
			v-if="phase !== GamePhase.LOADING"
			:is-muted="isMuted"
			:quality="quality"
			:captions="captions"
			@toggle-mute="toggleMute"
			@help="toggleHelp(true)"
			@cycle-quality="cycleQuality"
			@cycle-captions="cycleCaptions"
		/>

		<Transition name="fade">
			<ControlsCard v-if="isHelpOpen" @close="toggleHelp(false)" />
		</Transition>
	</div>
</template>
