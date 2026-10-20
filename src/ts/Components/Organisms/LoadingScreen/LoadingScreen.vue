<script setup lang="ts">
import Pulse from '../../Atoms/Pulse/Pulse.vue';
import Text from '../../Atoms/Text/Text.vue';
</script>

<template>
	<div class="loading-screen" role="status">
		<Pulse />
		<Text font-size="label" color="muted">Pressurising the deep</Text>
	</div>
</template>
