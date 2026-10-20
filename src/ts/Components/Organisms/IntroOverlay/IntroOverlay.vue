<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Action from '../../Atoms/Action/Action.vue';

defineEmits<{
	begin: [];
}>();
</script>

<template>
	<section class="intro-overlay">
		<div class="intro-overlay__content">
			<Text font-size="label" color="eyebrow" shadow>Her signal came back after twenty years</Text>
			<h1 class="intro-overlay__title">
				<Text tag="span" font-size="display" outline>Under</Text>
				<Text tag="span" font-size="display" shadow>tow</Text>
			</h1>
			<Text font-size="lead" color="muted" class="intro-overlay__text" shadow>
				Twenty years ago, marine biologist Mara Vale dove into this canyon and never came up. Today her beacon started
				calling again. Follow it down.
			</Text>
			<Action @click="$emit('begin')">Begin the descent</Action>
			<Text font-size="label" color="subtle" shadow>Best with sound on · Scroll to dive</Text>
		</div>
	</section>
</template>
