import { Vector3 } from 'three';
import { SURFACE_Y, canyonCentre } from '../Config/world.ts';
import { NARRATION } from './narration.ts';
import type World from '../World/World.ts';
import type { IChapter, IJourney, IShot, IStop } from './IJourney.ts';

/** What the stops do to the world; implemented by the experience. */
export interface IJourneyActions {
	receiveSignal(): void;
	playLog(): void;
	followWhale(): void;
	wakeTemple(): void;
	wakeCity(): void;
}

/**
 * Undertow, as a camera path. Twenty years after Mara Vale vanished, her signal calls her child down:
 * reef → kelp → wreck → the whale road → a drowned temple → Atlantis. Shots are placed relative to
 * each scene's landmarks, so moving a landmark moves its shots with it.
 */
export default class JourneyScript {
	private readonly _world: World;
	private readonly _actions: IJourneyActions;

	constructor(world: World, actions: IJourneyActions) {
		this._world = world;
		this._actions = actions;
	}

	public build(): IJourney {
		return {
			shots: this.shots(),
			captions: NARRATION,
			chapters: this.chapters(),
			stops: this.stops()
		};
	}

	private chapters(): IChapter[] {
		return [
			{
				numeral: 'I',
				title: 'The Reef',
				subtitle: 'Her signal came back after twenty years',
				location: 'The Reef',
				from: 0.04,
				to: 0.2
			},
			{
				numeral: 'II',
				title: 'Kelp Cathedral',
				subtitle: 'The light comes down in pillars here',
				location: 'Kelp Cathedral',
				from: 0.2,
				to: 0.34
			},
			{
				numeral: 'III',
				title: 'The Wreck',
				subtitle: 'Three hundred years asleep. Twenty of them with her',
				location: 'The Wreck',
				from: 0.34,
				to: 0.5
			},
			{
				numeral: 'IV',
				title: 'The Whale Road',
				subtitle: 'Some roads are sung, not built',
				location: 'The Whale Road',
				from: 0.5,
				to: 0.66
			},
			{
				numeral: 'V',
				title: 'The Drowned Temple',
				subtitle: 'The guardians were built to wait',
				location: 'The Drowned Temple',
				from: 0.66,
				to: 0.82
			},
			{
				numeral: 'VI',
				title: 'Atlantis',
				subtitle: 'She stayed to keep it lit',
				location: 'Atlantis',
				from: 0.82,
				to: 1.01
			}
		];
	}

	private stops(): IStop[] {
		const { reef, wreck, passage, temple, atlantis } = this._world;

		return [
			{
				id: 'marker',
				progress: 0.15,
				label: 'Listen to the signal',
				hotspot: () => reef.marker,
				onActivate: () => this._actions.receiveSignal()
			},
			{
				id: 'recorder',
				progress: 0.45,
				label: 'Play Mara’s last log',
				hotspot: () => wreck.recorder,
				onActivate: () => this._actions.playLog()
			},
			{
				id: 'whale',
				progress: 0.53,
				label: 'Follow the whale',
				hotspot: () => passage.whale.position,
				onActivate: () => this._actions.followWhale()
			},
			{
				id: 'altar',
				progress: 0.78,
				label: 'Return the light',
				hotspot: () => temple.altar,
				onActivate: () => this._actions.wakeTemple()
			},
			{
				id: 'heart',
				progress: 0.93,
				label: 'Wake the city',
				hotspot: () => atlantis.heart,
				onActivate: () => this._actions.wakeCity()
			}
		];
	}

	private shots(): IShot[] {
		const { reef, wreck, passage, temple, atlantis } = this._world;
		const marker = reef.marker;
		const recorder = wreck.recorder;
		const origin = wreck.origin;
		const ledge = passage.ledge;
		const route = passage.route;
		const altar = temple.altar;
		const shrine = temple.origin;
		const heart = atlantis.heart;
		const plaza = atlantis.plaza;
		const whaleCircle = new Vector3(canyonCentre(-490), -58, -490);
		const routePoint = (index: number): Vector3 => (route[index] ?? ledge).clone();

		return [
			// Just under the surface, sun overhead
			this.shot(0, this.absolute(0, -2.2, 105), this.absolute(0, -0.5, 70)),
			this.shot(0.04, this.absolute(0, -4, 88), this.absolute(0, -11, 50)),
			// I. Over the reef to Mara's marker
			this.shot(0.09, this.onFloor(4, 6, 45), this.onFloor(-4, 2, 5)),
			this.shot(0.125, this.onFloor(-2, 4.5, -20), marker.clone().add(new Vector3(0, 3, 0))),
			this.shot(0.15, marker.clone().add(new Vector3(2.5, 2.2, 7)), marker.clone().add(new Vector3(0, 0.2, 0))),
			this.shot(0.175, marker.clone().add(new Vector3(-3, 4, 6)), marker.clone().setY(-2)),
			this.shot(0.2, this.onFloor(0, 7, -125), this.onFloor(0, 5, -165)),
			// II. Through the kelp
			this.shot(0.24, this.onFloor(-6, 9, -150), this.onFloor(4, 10, -190)),
			this.shot(0.28, this.onFloor(6, 11, -195), this.onFloor(-6, 15, -230)),
			this.shot(0.32, this.onFloor(-4, 8, -240), this.onFloor(0, 2, -285)),
			// III. Around the wreck to her recorder
			this.shot(0.36, this.onFloor(0, 12, -280), origin.clone().add(new Vector3(0, 4, 0))),
			this.shot(0.4, origin.clone().add(new Vector3(20, 9, 16)), origin.clone().add(new Vector3(0, 3, 0))),
			this.shot(0.43, origin.clone().add(new Vector3(-6, 5, 20)), recorder.clone().add(new Vector3(0, 0.5, 0))),
			this.shot(0.45, recorder.clone().add(new Vector3(-1.5, 1.6, 3.2)), recorder.clone().add(new Vector3(0, 0.25, 0))),
			this.shot(0.475, origin.clone().add(new Vector3(-16, 7, -6)), origin.clone().add(new Vector3(0, 4, -20))),
			this.shot(0.5, this.onFloor(0, 6, -415), ledge.clone().add(new Vector3(0, -6, -40))),
			// IV. Off the ledge, behind the whale, down the drop
			this.shot(0.53, ledge.clone().add(new Vector3(0, 3, 6)), whaleCircle),
			this.shot(0.57, routePoint(1).add(new Vector3(5, 7, 16)), routePoint(2)),
			this.shot(0.61, routePoint(3).add(new Vector3(-5, 7, 16)), routePoint(4)),
			this.shot(0.65, routePoint(5).add(new Vector3(4, 8, 18)), routePoint(6).add(new Vector3(0, -6, -20))),
			// V. Down onto the temple, to the altar
			this.shot(0.69, shrine.clone().add(new Vector3(0, 17, 52)), shrine.clone().add(new Vector3(0, 6, 0))),
			this.shot(0.72, shrine.clone().add(new Vector3(22, 10, 42)), shrine.clone().add(new Vector3(13.5, 9, 22))),
			this.shot(0.75, shrine.clone().add(new Vector3(0, 7, 32)), shrine.clone().add(new Vector3(0, 6, -2))),
			this.shot(0.78, temple.threshold, altar.clone().add(new Vector3(0, 0.8, 0))),
			this.shot(0.8, shrine.clone().add(new Vector3(0, 18, -6)), shrine.clone().add(new Vector3(0, 6, -40))),
			this.shot(0.82, shrine.clone().add(new Vector3(0, 14, -60)), atlantis.plaza.clone().add(new Vector3(0, 10, 0))),
			// VI. Atlantis: high over the city, down the avenue through the gate, to the heart, then up the pillar of light
			this.shot(0.85, plaza.clone().add(new Vector3(0, 24, 78)), heart),
			this.shot(0.885, plaza.clone().add(new Vector3(0, 7, 60)), heart),
			this.shot(0.91, plaza.clone().add(new Vector3(0, 4, 34)), heart),
			this.shot(0.93, heart.clone().add(new Vector3(0, -2, 14)), heart),
			this.shot(0.96, heart.clone().add(new Vector3(-22, 4, 26)), heart.clone().add(new Vector3(0, 6, 0))),
			this.shot(0.985, heart.clone().add(new Vector3(-12, 45, 22)), heart.clone().add(new Vector3(0, 90, -10))),
			this.shot(
				1,
				new Vector3(heart.x - 6, SURFACE_Y - 12, heart.z + 14),
				new Vector3(heart.x, SURFACE_Y + 30, heart.z - 6)
			)
		];
	}

	private shot(progress: number, position: Vector3, target: Vector3): IShot {
		return { progress, position, target };
	}

	/** A point `height` metres above the seabed, `offset` metres across the canyon. */
	private onFloor(offset: number, height: number, z: number): Vector3 {
		const x = canyonCentre(z) + offset;

		return new Vector3(x, this._world.seabed.heightAt(x, z) + height, z);
	}

	/** A point at an absolute depth, `offset` metres across the canyon. */
	private absolute(offset: number, y: number, z: number): Vector3 {
		return new Vector3(canyonCentre(z) + offset, y, z);
	}
}
