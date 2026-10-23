/** What the diver did, printed on the postcard. */
export interface IDiveLog {
	/** Metres below the surface at the deepest point. */
	readonly maxDepth: number;
	/** Seconds spent under water. */
	readonly seconds: number;
	readonly lights: number;
}

// A postcard of the dive: a frame of the experience with the title and the dive's numbers over it,
// downloaded as a PNG.
const MAX_WIDTH = 1800;
const FONT = '"Saira", system-ui, sans-serif';
const FILE_NAME = 'undertow-postcard.png';

export async function composePostcard(frame: HTMLCanvasElement, log: IDiveLog): Promise<Blob> {
	const scale = Math.min(1, MAX_WIDTH / frame.width);
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(frame.width * scale);
	canvas.height = Math.round(frame.height * scale);

	const context = canvas.getContext('2d');

	if (!context) {
		throw new Error('No 2D canvas for the postcard');
	}

	const { width, height } = canvas;
	const unit = Math.min(width, height) / 100;
	context.drawImage(frame, 0, 0, width, height);

	// Darken the lower part so the lettering reads over the sunset
	const shade = context.createLinearGradient(0, height * 0.45, 0, height);
	shade.addColorStop(0, 'rgba(4, 16, 22, 0)');
	shade.addColorStop(1, 'rgba(4, 16, 22, 0.78)');
	context.fillStyle = shade;
	context.fillRect(0, 0, width, height);

	context.textAlign = 'center';
	context.textBaseline = 'alphabetic';
	context.fillStyle = '#e8fbff';

	text(context, 'UNDERTOW', width / 2, height - unit * 30, `500 ${unit * 2.4}px ${FONT}`, unit * 1);
	text(context, 'SHE KEPT THE LIGHT', width / 2, height - unit * 18, `600 ${unit * 9}px ${FONT}`, unit * 0.1);

	const minutes = Math.max(1, Math.round(log.seconds / 60));
	const numbers = [
		`DEEPEST ${Math.round(log.maxDepth)} M`,
		`${minutes} MIN UNDER`,
		`${log.lights} ${log.lights === 1 ? 'LIGHT' : 'LIGHTS'} CARRIED HOME`
	].join('   ·   ');
	context.fillStyle = 'rgba(232, 251, 255, 0.78)';
	text(context, numbers, width / 2, height - unit * 8, `500 ${unit * 2.2}px ${FONT}`, unit * 0.5);

	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('The postcard could not be encoded'))),
			'image/png'
		)
	);
}

/** Downloads the postcard as a PNG. */
export function downloadPostcard(blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = FILE_NAME;
	link.click();
	URL.revokeObjectURL(url);
}

function text(
	context: CanvasRenderingContext2D,
	value: string,
	x: number,
	y: number,
	font: string,
	tracking: number
): void {
	context.font = font;
	context.letterSpacing = `${tracking}px`;
	context.fillText(value, x, y);
}
