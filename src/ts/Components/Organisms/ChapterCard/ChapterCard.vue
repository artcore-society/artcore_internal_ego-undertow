<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import Heading from '../../Atoms/Heading/Heading.vue';
import Wave from '../../Atoms/Wave/Wave.vue';
import type { IChapterCard } from '../../../Story/IChapter.ts';

defineProps<{
	card: Readonly<IChapterCard>;
}>();
</script>

<template>
	<section class="chapter-card" aria-live="polite">
		<Text font-size="label" color="eyebrow">Chapter {{ card.numeral }}</Text>
		<Wave />
		<Heading :level="2" font-size="display">{{ card.title }}</Heading>
		<Text font-size="lead" color="muted"
			><em>{{ card.subtitle }}</em></Text
		>
	</section>
</template>
