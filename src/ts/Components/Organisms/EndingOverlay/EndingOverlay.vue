<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Action from '../../Atoms/Action/Action.vue';
import { CREDITS } from '../../../Config/credits.ts';

defineProps<{
	lights: number;
}>();

defineEmits<{
	again: [];
}>();
</script>

<template>
	<section class="ending-overlay">
		<div class="ending-overlay__title">
			<Text font-size="label" color="eyebrow" shadow>Undertow</Text>
			<h2 class="ending-overlay__heading">
				<Text tag="span" font-size="display" outline>She kept</Text>
				<Text tag="span" font-size="display" shadow>the light</Text>
			</h2>
			<Text font-size="lead" color="muted" class="ending-overlay__text" shadow>
				The storm has passed. You surface at sunset, alone on a quiet sea, and for the first time in twenty years it
				doesn’t feel empty. Far below, a city glows. It will know you when you come back.
			</Text>
			<Text font-size="label" color="muted" numeric shadow>{{ lights }} lights carried home</Text>
			<Action @click="$emit('again')">Dive again</Action>
		</div>

		<div class="ending-overlay__credits" aria-label="Credits">
			<div class="ending-overlay__roll">
				<div v-for="credit in CREDITS" :key="credit.role" class="ending-overlay__credit">
					<Text font-size="label" color="subtle">{{ credit.role }}</Text>
					<Text v-for="name in credit.names" :key="name" font-size="body" color="muted">{{ name }}</Text>
				</div>
			</div>
		</div>
	</section>
</template>
