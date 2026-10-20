import { Vector3 } from 'three';
import { SceneId } from '../Enums/SceneId.ts';
import ActionStep from './Steps/ActionStep.ts';
import FollowStep from './Steps/FollowStep.ts';
import GatherStep from './Steps/GatherStep.ts';
import NarrationStep from './Steps/NarrationStep.ts';
import ShowcaseStep from './Steps/ShowcaseStep.ts';
import SwimToStep from './Steps/SwimToStep.ts';
import type IChapter from './IChapter.ts';
import type World from '../World/World.ts';

/**
 * Undertow. Twenty years after Dr. Mara Vale vanished on a dive, her beacon starts calling again.
 * Her child follows it down: reef → kelp → her wreck → the whale road → a drowned temple → Atlantis.
 */
export default class StoryScript {
	private readonly _world: World;

	constructor(world: World) {
		this._world = world;
	}

	public chapters(): IChapter[] {
		return [
			this.theReef(),
			this.kelpCathedral(),
			this.theWreck(),
			this.whaleRoad(),
			this.drownedTemple(),
			this.atlantis()
		];
	}

	private theReef(): IChapter {
		const reef = this._world.reef;

		return {
			numeral: 'I',
			title: 'The Reef',
			subtitle: 'Her signal came back after twenty years.',
			steps: [
				new NarrationStep([
					{ speaker: 'Kai', text: 'Radio check. You hear me down there?' },
					{ speaker: 'You', text: 'Loud and clear, Kai. Water’s warm.' },
					{
						speaker: 'Kai',
						text: 'Twenty years since your mother’s last dive, and today her beacon starts pinging again.'
					},
					{
						speaker: 'Kai',
						text: 'It’s coming from her old dive marker, at the far edge of the reef. Follow the signal.'
					}
				]),
				new SwimToStep('Find Mara’s dive marker', reef.marker.clone().setY(reef.marker.y + 3), 6),
				new ActionStep((context) => context.cue('discovery')),
				new NarrationStep([
					{ speaker: 'Mara', text: 'Log one. If you’re hearing this, you found my marker. I always knew you would.' },
					{ speaker: 'You', text: 'Mom…?' },
					{ speaker: 'Kai', text: 'It’s a recording. Has to be. Breathe.' },
					{ speaker: 'Mara', text: 'I left you a trail. Follow the light, little fish.' }
				]),
				new GatherStep('Gather Mara’s light', SceneId.REEF, 3),
				new NarrationStep([
					{ speaker: 'Kai', text: 'Keep an eye on your air. The vents breathe bubbles: swim into a column to top up.' },
					{ speaker: 'Kai', text: 'The signal’s moving. Deeper, into the kelp.' }
				]),
				new SwimToStep('Follow the signal into the kelp', this.above(this._world.kelp.centre, 7, 70), 14)
			]
		};
	}

	private kelpCathedral(): IChapter {
		const wreck = this._world.wreck;

		return {
			numeral: 'II',
			title: 'Kelp Cathedral',
			subtitle: 'The light comes down in pillars here.',
			steps: [
				new NarrationStep([
					{
						speaker: 'Mara',
						text: 'Log two. The kelp grows so tall here it feels like church. You used to fall asleep in church.'
					},
					{ speaker: 'You', text: 'I did not.' },
					{ speaker: 'Kai', text: 'You did.' }
				]),
				new GatherStep('Find the light among the stalks', SceneId.KELP, 5),
				new NarrationStep([
					{
						speaker: 'Mara',
						text: 'Log three. The Halcyon is anchored past the forest. Something below keeps calling. I’m going to look.'
					},
					{ speaker: 'Kai', text: 'The Halcyon… her research ship. They told us it went down in a storm.' }
				]),
				new SwimToStep('Reach the Halcyon', wreck.breach, 9)
			]
		};
	}

	private theWreck(): IChapter {
		const wreck = this._world.wreck;

		return {
			numeral: 'III',
			title: 'The Halcyon',
			subtitle: 'Not lost in a storm. Pulled down.',
			steps: [
				new ShowcaseStep(this.above(wreck.centre, 6), 5, 28),
				new NarrationStep([
					{ speaker: 'Kai', text: 'It’s dark in there. Your lamp’s on F.' },
					{ speaker: 'Kai', text: 'And careful. Wrecks bite.' }
				]),
				new GatherStep('Search the hull', SceneId.WRECK, 3),
				new SwimToStep('Find Mara’s log in the deckhouse', wreck.log, 2.6),
				new ActionStep((context) => context.cue('discovery')),
				new NarrationStep([
					{ speaker: 'Mara', text: 'Final log. The signal isn’t a machine. It’s a song. And it’s coming from a city.' },
					{
						speaker: 'Mara',
						text: 'Past the drop there is a road only the whales remember. If anyone comes looking for me: follow the whale.'
					},
					{ speaker: 'You', text: 'A city? Kai, are you getting this?' },
					{ speaker: 'Kai', text: 'Every word. Fill your tank before the drop. It gets very deep, very fast.' }
				]),
				new SwimToStep(
					'Head for the drop-off',
					this._world.passage.ledge.clone().setY(this._world.passage.ledge.y + 4),
					12
				)
			]
		};
	}

	private whaleRoad(): IChapter {
		const passage = this._world.passage;
		const whale = passage.whale;
		const destination = passage.route[passage.route.length - 1] ?? passage.centre;

		return {
			numeral: 'IV',
			title: 'The Whale Road',
			subtitle: 'Some roads are sung, not built.',
			steps: [
				new ActionStep((context) => context.cue('whale')),
				new ShowcaseStep(whale.position.clone(), 6, 34),
				new NarrationStep([
					{ speaker: 'The Deep', text: 'Little light. You came back.' },
					{ speaker: 'Kai', text: 'Did you hear that? That wasn’t Mara.' },
					{ speaker: 'You', text: 'The whale, Kai. It’s waiting for me.' }
				]),
				new ActionStep((context) => {
					whale.guide(true);
					context.activateShards(SceneId.PASSAGE);
				}),
				new NarrationStep(
					[
						{ speaker: 'Kai', text: 'I’m losing you… the radio won’t reach much further…' },
						{ speaker: 'Mara', text: 'Breathe slow. The sea rewards the patient.' }
					],
					false
				),
				new FollowStep('Follow the whale down', () => whale.position, destination, 22),
				new ActionStep((context) => {
					whale.guide(false);
					context.cue('whale');
				}),
				new NarrationStep([{ speaker: 'You', text: 'It’s gone. And there are… columns. Down here.' }])
			]
		};
	}

	private drownedTemple(): IChapter {
		const temple = this._world.temple;
		const atlantis = this._world.atlantis;

		return {
			numeral: 'V',
			title: 'The Drowned Temple',
			subtitle: 'The guardians were built to wait.',
			steps: [
				new ShowcaseStep(this.above(temple.centre, 10), 6, 42),
				new NarrationStep([
					{ speaker: 'Mara', text: 'If you made it this far, you’re braver than I was at your age.' },
					{ speaker: 'The Deep', text: 'Bring the light to the altar.' }
				]),
				new GatherStep('Gather the last of the light', SceneId.TEMPLE, 3),
				new SwimToStep('Carry the light to the altar', temple.altar, 3),
				new ActionStep((context) => {
					temple.lightAltar();
					temple.wake();
					context.cue('rumble');
					context.shake(0.6);
				}),
				new NarrationStep([
					{ speaker: 'The Deep', text: 'The light remembers her hands.' },
					{ speaker: 'Mara', text: '…You found me.' },
					{ speaker: 'You', text: 'Mom? Where are you?' },
					{ speaker: 'Mara', text: 'Where the light is. Come down, little fish. The city is waking.' }
				]),
				new SwimToStep('Descend to the city', this.above(atlantis.centre, 26, 95), 22)
			]
		};
	}

	private atlantis(): IChapter {
		const atlantis = this._world.atlantis;

		return {
			numeral: 'VI',
			title: 'Atlantis',
			subtitle: 'She stayed to keep it lit.',
			steps: [
				new ShowcaseStep(atlantis.heart, 7, 64),
				new NarrationStep([
					{ speaker: 'The Deep', text: 'She stayed so the city would not go dark. Twenty years, she kept the light.' },
					{
						speaker: 'Mara',
						text: 'I couldn’t leave it, and I couldn’t call you. Not until you were ready to hear it.'
					}
				]),
				new SwimToStep('Bring the light to the heart of Atlantis', atlantis.heart, 6),
				new ActionStep((context) => {
					atlantis.awaken();
					context.setIlluminated(true);
					context.cue('discovery');
					context.shake(0.35);
				}),
				new ShowcaseStep(atlantis.heart, 11, 85),
				new NarrationStep([
					{ speaker: 'Mara', text: 'There. Now it shines on its own.' },
					{
						speaker: 'Mara',
						text: 'Go up, little fish. Breathe slow. And come back sometimes: the sea will know you.'
					},
					{ speaker: 'You', text: 'I will.' },
					{
						speaker: 'Kai',
						text: '…Signal’s clear. Whatever you did down there, the whole sea is glowing on my sonar. Come home.'
					}
				])
			]
		};
	}

	/** A point above a scene centre, optionally shifted towards the surface side (+Z). */
	private above(point: Vector3, height: number, forward = 0): Vector3 {
		const z = point.z + forward;
		const x = point.x;

		return new Vector3(x, this._world.seabed.heightAt(x, z) + height, z);
	}
}
