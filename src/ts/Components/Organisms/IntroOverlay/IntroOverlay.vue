<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Action from '../../Atoms/Action/Action.vue';

defineProps<{
	/** Someone who has been down before: the deep remembers them. */
	isReturning?: boolean;
}>();

defineEmits<{
	begin: [];
}>();
</script>

<template>
	<section class="intro-overlay">
		<div class="intro-overlay__content">
			<Text font-size="label" color="eyebrow" shadow>
				{{ isReturning ? 'The deep remembers you' : 'Her signal came back after twenty years' }}
			</Text>
			<h1 class="intro-overlay__title">
				<Text tag="span" font-size="display" outline>Under</Text>
				<Text tag="span" font-size="display" shadow>tow</Text>
			</h1>
			<Text v-if="isReturning" font-size="lead" color="muted" class="intro-overlay__text" shadow>
				Far below, a city still glows where you left it. Mara’s beacon is calling again, softer now, as if it knows the
				way is yours. Go back down.
			</Text>
			<Text v-else font-size="lead" color="muted" class="intro-overlay__text" shadow>
				Twenty years ago, marine biologist Mara Vale dove into this canyon and never came up. Today her beacon started
				calling again. Follow it down.
			</Text>
			<Action @click="$emit('begin')">{{ isReturning ? 'Dive again' : 'Begin the descent' }}</Action>
			<Text font-size="label" color="subtle" shadow>Best with sound on · Scroll to dive</Text>
		</div>
	</section>
</template>
