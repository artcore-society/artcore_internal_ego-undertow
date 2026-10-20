<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Text from '../../Atoms/Text/Text.vue';
import Action from '../../Atoms/Action/Action.vue';
import { CREDITS } from '../../../Config/credits.ts';

defineProps<{
	lights: number;
}>();

defineEmits<{
	again: [];
}>();

/** Seconds the credits hold before the closing card. */
const CREDITS_SECONDS = 11;

/** First the credits roll, then the closing card. A click skips ahead. */
const isClosing = ref(false);
let timer = 0;

function close(): void {
	window.clearTimeout(timer);
	isClosing.value = true;
}

onMounted(() => (timer = window.setTimeout(close, CREDITS_SECONDS * 1000)));
onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<template>
	<section class="ending-overlay" @click="close">
		<Transition name="fade" mode="out-in">
			<div v-if="!isClosing" key="credits" class="ending-overlay__credits-wrap">
				<Text font-size="label" color="eyebrow">Made with</Text>
				<dl class="ending-overlay__credits" data-frame aria-label="Credits">
					<div v-for="credit in CREDITS" :key="credit.role" class="ending-overlay__credit">
						<Text tag="dt" font-size="label" color="eyebrow">{{ credit.role }}</Text>
						<Text v-for="name in credit.names" :key="name" tag="dd" font-size="label">{{ name }}</Text>
					</div>
				</dl>
				<Text font-size="label" color="subtle">Click to continue</Text>
			</div>

			<div v-else key="title" class="ending-overlay__title">
				<Text font-size="label" color="eyebrow">Undertow</Text>
				<h2 class="ending-overlay__heading">
					<Text tag="span" font-size="display" outline>She kept</Text>
					<Text tag="span" font-size="display">the light</Text>
				</h2>
				<Text font-size="lead" class="ending-overlay__text">
					The storm has passed. You surface at sunset, alone on a quiet sea, and for the first time in twenty years it
					doesn’t feel empty. Far below, a city glows. It will know you when you come back.
				</Text>
				<Text font-size="label" numeric>{{ lights }} lights carried home</Text>
				<Action @click.stop="$emit('again')">Dive again</Action>
			</div>
		</Transition>
	</section>
</template>
