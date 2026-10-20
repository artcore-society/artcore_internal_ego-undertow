import AmbientLayer from './AmbientLayer.ts';

/** A low, beating hum that grows with depth: the abyss has a voice. */
export default class DeepDrone extends AmbientLayer {
	protected get maxGain(): number {
		return 0.32;
	}

	protected build(context: AudioContext, output: AudioNode): void {
		const lowpass = context.createBiquadFilter();
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 180;
		lowpass.connect(output);

		[41.2, 41.7, 61.8].forEach((frequency, index) => {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.type = index === 2 ? 'triangle' : 'sawtooth';
			oscillator.frequency.value = frequency;
			gain.gain.value = index === 2 ? 0.25 : 0.4;
			oscillator.connect(gain).connect(lowpass);
			oscillator.start();
		});
	}
}
