import type { ICaption, Speaker } from './IJourney.ts';

/** Casting notes for each voice; also exported with the voice script for recording. */
export const VOICES: Readonly<Record<Speaker, string>> = {
	Kai: 'Male, 30s, warm and steady, a friend on the boat radio. Record clean: the radio filter is added in the experience.',
	Mara: 'Female, 50s, calm and intimate, a marine biologist speaking into a recorder. Tender, a little weary, never dramatic.',
	You: 'Young adult, quiet and awed, close to the mic, as if speaking through a regulator. Few words, lots of breath.',
	'The Deep':
		'Ageless and genderless, very slow, low and soft, almost a whisper. Record dry: reverb is added in the experience.'
};

/**
 * Every spoken line, in order, with the stretch of the journey (0..1) it plays across.
 * The `id` is also the voice file name: public/assets/voice/<id>.mp3.
 */
export const NARRATION: readonly ICaption[] = [
	{ id: '01-kai-radio-check', from: 0.006, to: 0.034, speaker: 'Kai', text: 'Radio check. You hear me down there?' },
	{
		id: '02-you-loud-and-clear',
		from: 0.07,
		to: 0.098,
		speaker: 'You',
		text: 'Loud and clear, Kai. The water’s warm.'
	},
	{
		id: '03-kai-twenty-years',
		from: 0.1,
		to: 0.138,
		speaker: 'Kai',
		text: 'Twenty years since your mother’s last dive, and today her beacon starts calling again. From her old marker, at the edge of the reef.'
	},
	{
		id: '04-mara-log-one',
		from: 0.152,
		to: 0.175,
		speaker: 'Mara',
		text: 'Log one. If you’re hearing this, you found my marker. I always knew you would.'
	},
	{
		id: '05-mara-follow-the-light',
		from: 0.176,
		to: 0.198,
		speaker: 'Mara',
		text: 'I left you a trail. Follow the light, little fish.'
	},
	{
		id: '06-mara-log-two',
		from: 0.23,
		to: 0.258,
		speaker: 'Mara',
		text: 'Log two. The kelp grows so tall here it feels like a cathedral. You used to fall asleep in church.'
	},
	{ id: '07-you-i-did-not', from: 0.26, to: 0.278, speaker: 'You', text: 'I did not.' },
	{ id: '08-kai-you-did', from: 0.28, to: 0.298, speaker: 'Kai', text: 'You did.' },
	{
		id: '09-mara-log-three',
		from: 0.3,
		to: 0.336,
		speaker: 'Mara',
		text: 'Log three. There’s an old wreck past the forest. Something beneath it keeps calling. I’m going to look.'
	},
	{
		id: '10-kai-old-galleon',
		from: 0.37,
		to: 0.4,
		speaker: 'Kai',
		text: 'An old galleon. She studied it for years. They told us her boat went down in a storm, right above it.'
	},
	{
		id: '11-you-recorder',
		from: 0.405,
		to: 0.44,
		speaker: 'You',
		text: 'Something’s blinking in the sand… It’s her recorder.'
	},
	{
		id: '12-mara-final-log',
		from: 0.452,
		to: 0.47,
		speaker: 'Mara',
		text: 'Final log. The signal isn’t a machine. It’s a song. And it’s coming from a city.'
	},
	{
		id: '13-mara-follow-the-whale',
		from: 0.471,
		to: 0.497,
		speaker: 'Mara',
		text: 'Past the drop, there’s a road only the whales remember. If anyone comes looking for me: follow the whale.'
	},
	{
		id: '14-kai-the-drop',
		from: 0.505,
		to: 0.527,
		speaker: 'Kai',
		text: 'That’s a two hundred metre drop. Take it slow.'
	},
	{ id: '15-deep-you-came-back', from: 0.535, to: 0.558, speaker: 'The Deep', text: 'Little light. You came back.' },
	{ id: '16-kai-not-mara', from: 0.56, to: 0.585, speaker: 'Kai', text: 'Did you hear that? That wasn’t Mara.' },
	{
		id: '17-kai-losing-you',
		from: 0.59,
		to: 0.62,
		speaker: 'Kai',
		text: 'I’m losing you… the radio won’t reach much further…'
	},
	{
		id: '18-mara-breathe-slow',
		from: 0.625,
		to: 0.656,
		speaker: 'Mara',
		text: 'Breathe slow. The sea rewards the patient.'
	},
	{
		id: '19-you-a-temple',
		from: 0.69,
		to: 0.718,
		speaker: 'You',
		text: 'Columns. Statues. Kai… there’s a temple down here.'
	},
	{
		id: '20-mara-braver',
		from: 0.72,
		to: 0.748,
		speaker: 'Mara',
		text: 'If you made it this far, you’re braver than I was at your age.'
	},
	{ id: '21-deep-bring-the-light', from: 0.75, to: 0.776, speaker: 'The Deep', text: 'Bring the light to the altar.' },
	{ id: '22-deep-remembers', from: 0.782, to: 0.8, speaker: 'The Deep', text: 'The light remembers her hands.' },
	{
		id: '23-mara-you-found-me',
		from: 0.801,
		to: 0.82,
		speaker: 'Mara',
		text: '…You found me. Come down, little fish. The city is waking.'
	},
	{
		id: '24-deep-she-stayed',
		from: 0.85,
		to: 0.878,
		speaker: 'The Deep',
		text: 'She stayed so the city would not go dark. Twenty years, she kept the light.'
	},
	{
		id: '25-mara-not-ready',
		from: 0.88,
		to: 0.91,
		speaker: 'Mara',
		text: 'I couldn’t leave it, and I couldn’t call you. Not until you were ready to hear it.'
	},
	{ id: '26-mara-shines', from: 0.935, to: 0.954, speaker: 'Mara', text: 'There. Now it shines on its own.' },
	{
		id: '27-mara-go-up',
		from: 0.955,
		to: 0.975,
		speaker: 'Mara',
		text: 'Go up, little fish. Breathe slow. And come back sometimes: the sea will know you.'
	},
	{
		id: '28-kai-come-home',
		from: 0.976,
		to: 0.993,
		speaker: 'Kai',
		text: '…Signal’s clear. The whole sea is glowing on my sonar. Come home.'
	}
];
