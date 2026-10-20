<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Action from '../../Atoms/Action/Action.vue';
import { CREDITS } from '../../../Config/credits.ts';

/** First the credits, just under the surface; continuing breaks the surface into the sunset and the closing card. */
defineProps<{
	lights: number;
	isSurfaced: boolean;
}>();

defineEmits<{
	continue: [];
	again: [];
}>();
</script>

<template>
	<section class="ending-overlay" :data-surfaced="isSurfaced || undefined">
		<Transition name="fade" mode="out-in">
			<div v-if="!isSurfaced" key="credits" class="ending-overlay__credits-wrap">
				<Text font-size="label" color="eyebrow">Made with</Text>
				<dl class="ending-overlay__credits" data-frame aria-label="Credits">
					<div v-for="credit in CREDITS" :key="credit.role" class="ending-overlay__credit">
						<Text tag="dt" font-size="label" color="eyebrow">{{ credit.role }}</Text>
						<Text v-for="name in credit.names" :key="name" tag="dd" font-size="label">{{ name }}</Text>
					</div>
				</dl>
				<Action class="ending-overlay__continue" @click="$emit('continue')">Surface</Action>
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
				<Action class="ending-overlay__again" @click="$emit('again')">Dive again</Action>
			</div>
		</Transition>
	</section>
</template>
