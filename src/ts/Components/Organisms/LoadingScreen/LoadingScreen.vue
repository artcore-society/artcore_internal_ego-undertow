<script setup lang="ts">
import Text from '../../Atoms/Text/Text.vue';
import ProgressBar from '../../Atoms/ProgressBar/ProgressBar.vue';

defineProps<{
	progress: number;
}>();
</script>

<template>
	<div class="loading-screen" role="status">
		<Text font-size="display" outline class="loading-screen__title">Undertow</Text>
		<div class="loading-screen__progress">
			<ProgressBar :value="progress" label="Loading the deep" />
			<div class="loading-screen__status">
				<Text tag="span" font-size="label" color="muted">Pressurising</Text>
				<Text tag="span" font-size="label" numeric>{{ Math.round(progress * 100) }}%</Text>
			</div>
		</div>
	</div>
</template>
