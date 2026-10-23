// A bell curve, 1 at 0: for soft rings and bands. Written as x * x, never pow(x, 2.0): Metal (Chrome on
// macOS) computes pow as exp2(y * log2(x)), which is NaN for a negative x, and one NaN pixel blooms into
// a black frame.
float bell(float x) {
	return exp(-x * x);
}
