import AmbientLayer from './AmbientLayer.ts';

/**
 * The reef's sound: thousands of snapping shrimp, a dense crackle like fat in a pan.
 * A looped buffer of sparse random clicks, high-passed.
 */
export default class ReefCrackle extends AmbientLayer {
	protected get maxGain(): number {
		return 0.08;
	}

	protected build(context: AudioContext, output: AudioNode): void {
		const seconds = 3;
		const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
		const data = buffer.getChannelData(0);

		for (let click = 0; click < seconds * 260; click++) {
			const start = Math.floor(Math.random() * (data.length - 64));
			const level = Math.pow(Math.random(), 3);

			for (let i = 0; i < 48; i++) {
				data[start + i] = (data[start + i] ?? 0) + (Math.random() * 2 - 1) * level * Math.exp(-i / 6);
			}
		}

		const source = context.createBufferSource();
		const highpass = context.createBiquadFilter();

		source.buffer = buffer;
		source.loop = true;
		highpass.type = 'highpass';
		highpass.frequency.value = 2200;
		source.connect(highpass).connect(output);
		source.start();
	}
}
