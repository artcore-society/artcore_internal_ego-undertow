import { AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import { damp } from '../../Helpers/math.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * Mara's light while her last log plays: a small warm glow that rises from the recorder and drifts a
 * little ahead of the diver, as if she were leading the way, then fades when she stops speaking.
 * A bright core and a faint shell only; the bloom pass gives it its halo (no light source: cheap).
 */
export default class MaraGhost extends Group implements IDisposable {
	private static readonly COLOR = new Color('#ffcf9a');

	private readonly _geometry = new SphereGeometry(1, 12, 8);
	private readonly _core = new MeshBasicMaterial({
		color: MaraGhost.COLOR.clone(),
		transparent: true,
		depthWrite: false
	});
	private readonly _shell = new MeshBasicMaterial({
		color: MaraGhost.COLOR.clone(),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});
	private _level = 0;
	private _isPresent = false;

	constructor() {
		super();

		const core = new Mesh(this._geometry, this._core);
		core.scale.setScalar(0.07);
		const shell = new Mesh(this._geometry, this._shell);
		shell.scale.setScalar(0.35);
		this.add(core, shell);
		this.visible = false;
	}

	public get isPresent(): boolean {
		return this._isPresent;
	}

	/** Rises from `from` (the recorder). */
	public appear(from: Readonly<Vector3>): void {
		this._isPresent = true;
		this.position.copy(from);
	}

	public leave(): void {
		this._isPresent = false;
	}

	/** @param ahead where it drifts to: a little ahead of the diver along the path */
	public update(ahead: Readonly<Vector3>, elapsed: number, delta: number): void {
		this._level = damp(this._level, this._isPresent ? 1 : 0, this._isPresent ? 1.2 : 0.8, delta);
		this.visible = this._level > 0.01;

		if (!this.visible) {
			return;
		}

		this.position.x = damp(this.position.x, ahead.x, 0.6, delta);
		this.position.y = damp(this.position.y, ahead.y + Math.sin(elapsed * 1.1) * 0.25, 0.6, delta);
		this.position.z = damp(this.position.z, ahead.z, 0.6, delta);

		const flicker = 0.85 + Math.sin(elapsed * 5.3) * 0.08 + Math.sin(elapsed * 2.1) * 0.07;
		this._core.color.copy(MaraGhost.COLOR).multiplyScalar(2.4 * flicker);
		this._core.opacity = this._level;
		this._shell.color.copy(MaraGhost.COLOR).multiplyScalar(0.35 * flicker * this._level);
	}

	public override dispose(): void {
		this._geometry.dispose();
		this._core.dispose();
		this._shell.dispose();
		super.dispose();
	}
}
