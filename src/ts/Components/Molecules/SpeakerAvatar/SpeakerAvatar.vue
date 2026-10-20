<script setup lang="ts">
import type { Speaker } from '../../../Journey/IJourney.ts';

defineProps<{
	speaker: Speaker;
	/** 0..1 loudness: the ring breathes with the voice. */
	level: number;
}>();
</script>

<template>
	<figure class="speaker-avatar" :data-speaker="speaker" :style="{ '--voice-level': level }" aria-hidden="true">
		<span class="speaker-avatar__ring" />
		<svg class="speaker-avatar__portrait" viewBox="0 0 100 100">
			<defs>
				<clipPath id="avatar-clip"><circle cx="50" cy="50" r="50" /></clipPath>
				<linearGradient id="avatar-kai" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#ffcf8a" />
					<stop offset="0.55" stop-color="#e2774f" />
					<stop offset="1" stop-color="#3a1f2b" />
				</linearGradient>
				<linearGradient id="avatar-mara" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#8ff7ec" />
					<stop offset="0.6" stop-color="#1f8ea0" />
					<stop offset="1" stop-color="#062236" />
				</linearGradient>
				<linearGradient id="avatar-you" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#d9f6ff" />
					<stop offset="0.55" stop-color="#4fa3c4" />
					<stop offset="1" stop-color="#0a2a3d" />
				</linearGradient>
				<radialGradient id="avatar-deep" cx="0.5" cy="0.5" r="0.6">
					<stop offset="0" stop-color="#4b2f8f" />
					<stop offset="0.6" stop-color="#160c33" />
					<stop offset="1" stop-color="#05030d" />
				</radialGradient>
				<linearGradient id="avatar-glass" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="#9fe7ff" stop-opacity="0.85" />
					<stop offset="0.5" stop-color="#16465a" />
					<stop offset="1" stop-color="#0a2230" />
				</linearGradient>
				<radialGradient id="avatar-iris" cx="0.5" cy="0.5" r="0.5">
					<stop offset="0" stop-color="#e7dcff" />
					<stop offset="0.45" stop-color="#9d7bff" />
					<stop offset="1" stop-color="#2a1660" />
				</radialGradient>
			</defs>

			<g clip-path="url(#avatar-clip)">
				<!-- Kai: on the boat, sunset behind, radio headset -->
				<template v-if="speaker === 'Kai'">
					<rect width="100" height="100" fill="url(#avatar-kai)" />
					<circle cx="74" cy="30" r="9" fill="#fff1c9" opacity="0.8" />
					<path d="M14 100 C17 79 32 70 50 70 C68 70 83 79 86 100Z" fill="#1d1420" />
					<circle cx="50" cy="47" r="17" fill="#1d1420" />
					<path d="M31 46 A19 19 0 0 1 69 46" fill="none" stroke="#ffd79a" stroke-width="3" />
					<rect x="27" y="42" width="8" height="13" rx="3.5" fill="#ffd79a" />
					<rect x="65" y="42" width="8" height="13" rx="3.5" fill="#ffd79a" />
					<path d="M31 53 Q33 64 44 63" fill="none" stroke="#ffd79a" stroke-width="2" />
					<circle cx="45" cy="63" r="2.4" fill="#ffd79a" />
				</template>

				<!-- Mara: mask pushed up on her forehead, hair tied back -->
				<template v-else-if="speaker === 'Mara'">
					<rect width="100" height="100" fill="url(#avatar-mara)" />
					<g fill="#d8fffb" opacity="0.5">
						<circle cx="22" cy="30" r="1.6" />
						<circle cx="26" cy="22" r="1.1" />
						<circle cx="19" cy="17" r="0.8" />
					</g>
					<path d="M14 100 C17 79 32 70 50 70 C68 70 83 79 86 100Z" fill="#071a24" />
					<path d="M42 70 L50 80 L58 70" fill="none" stroke="#5ef2e0" stroke-width="1.5" opacity="0.7" />
					<circle cx="64" cy="31" r="8" fill="#071a24" />
					<circle cx="50" cy="48" r="17" fill="#071a24" />
					<path d="M33 39 Q50 32 67 39" fill="none" stroke="#5ef2e0" stroke-width="1.6" opacity="0.8" />
					<rect
						x="34"
						y="31"
						width="32"
						height="12"
						rx="6"
						fill="url(#avatar-glass)"
						stroke="#5ef2e0"
						stroke-width="1.8"
					/>
					<path d="M38 34 L46 34" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.8" />
				</template>

				<!-- You: behind your own mask, regulator in, bubbles rising -->
				<template v-else-if="speaker === 'You'">
					<rect width="100" height="100" fill="url(#avatar-you)" />
					<path d="M12 100 C15 80 30 72 50 72 C70 72 85 80 88 100Z" fill="#0c1923" />
					<circle cx="50" cy="48" r="25" fill="#0c1923" />
					<rect
						x="29"
						y="35"
						width="42"
						height="21"
						rx="9"
						fill="url(#avatar-glass)"
						stroke="#c9f2ff"
						stroke-width="2"
					/>
					<path d="M34 39 L47 52" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.55" />
					<path d="M41 38 L47 44" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.45" />
					<rect x="43" y="59" width="14" height="10" rx="3.5" fill="#24323c" stroke="#7fa6b8" stroke-width="1" />
					<path d="M57 64 Q70 66 74 80" fill="none" stroke="#24323c" stroke-width="3.5" />
					<g fill="none" stroke="#e8fbff" stroke-width="1.2" opacity="0.8">
						<circle cx="74" cy="34" r="3" />
						<circle cx="79" cy="24" r="2.2" />
						<circle cx="75" cy="15" r="1.6" />
					</g>
				</template>

				<!-- The Deep: an eye in the dark -->
				<template v-else>
					<rect width="100" height="100" fill="url(#avatar-deep)" />
					<circle cx="50" cy="50" r="38" fill="none" stroke="#9d7bff" stroke-width="0.8" opacity="0.35" />
					<circle cx="50" cy="50" r="30" fill="none" stroke="#9d7bff" stroke-width="0.8" opacity="0.5" />
					<path d="M20 50 Q50 24 80 50 Q50 76 20 50Z" fill="#0b0620" stroke="#b9a2ff" stroke-width="1.2" />
					<circle cx="50" cy="50" r="13" fill="url(#avatar-iris)" />
					<ellipse cx="50" cy="50" rx="3.2" ry="10" fill="#05030d" />
					<circle cx="54" cy="45" r="2" fill="#ffffff" opacity="0.8" />
					<g fill="#c9b6ff">
						<circle cx="18" cy="24" r="0.9" />
						<circle cx="82" cy="72" r="1.1" />
						<circle cx="74" cy="20" r="0.7" />
						<circle cx="26" cy="80" r="0.8" />
					</g>
				</template>
			</g>
		</svg>
	</figure>
</template>
