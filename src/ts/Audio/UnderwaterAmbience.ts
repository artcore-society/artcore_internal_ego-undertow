import AmbientLayer from './AmbientLayer.ts';

/**
 * Being underwater: no waves, just pressure. A deep, still rumble of brown noise, a faint low
 * resonance of the water column, and almost nothing above a few hundred hertz.
 */
export default class UnderwaterAmbience extends AmbientLayer {
	protected get maxGain(): number {
		return 0.5;
	}

	protected build(context: AudioContext, output: AudioNode): void {
		const source = context.createBufferSource();
		const lowpass = context.createBiquadFilter();
		const resonance = context.createBiquadFilter();
		const hum = context.createOscillator();
		const humGain = context.createGain();

		source.buffer = UnderwaterAmbience.brownNoise(context);
		source.loop = true;
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 170;
		lowpass.Q.value = 0.2;
		// The water column rings very faintly
		resonance.type = 'peaking';
		resonance.frequency.value = 62;
		resonance.Q.value = 3;
		resonance.gain.value = 5;

		hum.frequency.value = 47;
		humGain.gain.value = 0.04;
		hum.connect(humGain).connect(output);
		hum.start();

		source.connect(lowpass).connect(resonance).connect(output);
		source.start();
	}

	/** Brown noise: white noise integrated, so its energy sits low like a distant rumble. */
	private static brownNoise(context: AudioContext): AudioBuffer {
		const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
		const data = buffer.getChannelData(0);
		let last = 0;

		for (let i = 0; i < data.length; i++) {
			last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
			data[i] = last * 3.5;
		}

		return buffer;
	}
}
