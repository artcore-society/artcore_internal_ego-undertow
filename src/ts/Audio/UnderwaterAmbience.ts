import AmbientLayer from './AmbientLayer.ts';

/** The pressure of water in your ears: deep filtered noise with a slow swell. */
export default class UnderwaterAmbience extends AmbientLayer {
	protected get maxGain(): number {
		return 0.55;
	}

	protected build(context: AudioContext, output: AudioNode): void {
		const lowpass = context.createBiquadFilter();
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 260;
		lowpass.Q.value = 0.4;

		const swell = context.createOscillator();
		const swellDepth = context.createGain();
		swell.frequency.value = 0.08;
		swellDepth.gain.value = 120;
		swell.connect(swellDepth).connect(lowpass.frequency);
		swell.start();

		this.noiseSource(context).connect(lowpass).connect(output);
	}
}
