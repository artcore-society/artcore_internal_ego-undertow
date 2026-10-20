<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Heading from '../../Atoms/Heading/Heading.vue';
import type { IChapterView } from '../../../Enums/ExperienceEvent.ts';

defineProps<{
	chapter: Readonly<IChapterView>;
}>();
</script>

<template>
	<section class="chapter-title" aria-live="polite">
		<Text font-size="label" color="eyebrow" shadow>Chapter {{ chapter.numeral }}</Text>
		<Heading :level="2" font-size="display" outline>{{ chapter.title }}</Heading>
		<Text font-size="lead" color="muted" shadow>{{ chapter.subtitle }}</Text>
	</section>
</template>
