import AmbientLayer from './AmbientLayer.ts';

/** Kelp in the surge: soft, swelling rustles, the forest leaning one way and back. */
export default class KelpRustle extends AmbientLayer {
	protected get maxGain(): number {
		return 0.09;
	}

	protected build(context: AudioContext, output: AudioNode): void {
		const bandpass = context.createBiquadFilter();
		const swell = context.createGain();
		const surge = context.createOscillator();
		const surgeDepth = context.createGain();
		const flutter = context.createOscillator();
		const flutterDepth = context.createGain();

		bandpass.type = 'bandpass';
		bandpass.frequency.value = 900;
		bandpass.Q.value = 0.8;
		swell.gain.value = 0.5;
		surge.frequency.value = 0.12;
		surgeDepth.gain.value = 0.45;
		flutter.frequency.value = 7;
		flutterDepth.gain.value = 0.12;

		surge.connect(surgeDepth).connect(swell.gain);
		flutter.connect(flutterDepth).connect(swell.gain);
		surge.start();
		flutter.start();
		this.noiseSource(context).connect(bandpass).connect(swell).connect(output);
	}
}
