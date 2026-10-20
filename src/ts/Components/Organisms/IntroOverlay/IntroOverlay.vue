<script setup lang="ts">
import Heading from '../../Atoms/Heading/Heading.vue';
import Text from '../../Atoms/Text/Text.vue';
import Wave from '../../Atoms/Wave/Wave.vue';
import ControlsLegend from '../../Molecules/ControlsLegend/ControlsLegend.vue';
import ModeOption from '../../Molecules/ModeOption/ModeOption.vue';
import { GameMode } from '../../../Enums/GameMode.ts';

defineEmits<{
	begin: [mode: GameMode];
}>();
</script>

<template>
	<section class="intro-overlay">
		<div class="intro-overlay__content">
			<div data-flow>
				<Text font-size="label" color="eyebrow">Her signal came back after twenty years</Text>
				<Heading :level="1" font-size="display">Undertow</Heading>
				<Wave size="l" />
				<Text class="intro-overlay__intro" font-size="lead" color="muted">
					Dr. Mara Vale vanished on a dive when you were a child. Today her beacon started calling again. Follow it down
					past the reef, through the kelp and her sunken ship, along the road the whales remember, to whatever has been
					singing in the dark all this time.
				</Text>
				<ControlsLegend />
			</div>

			<div class="intro-overlay__modes">
				<ModeOption
					title="The descent"
					description="Six chapters, from the reef to the abyss. About fifteen minutes. Watch your air."
					primary
					@select="$emit('begin', GameMode.STORY)"
				/>
				<ModeOption
					title="Free dive"
					description="No story, no air limit. Every place, every light, at your own pace."
					@select="$emit('begin', GameMode.FREE)"
				/>
			</div>
		</div>
	</section>
</template>
