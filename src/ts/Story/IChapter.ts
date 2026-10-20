import type IStoryStep from './Steps/IStoryStep.ts';

export interface IChapterCard {
	readonly numeral: string;
	readonly title: string;
	readonly subtitle: string;
}

export default interface IChapter extends IChapterCard {
	readonly steps: readonly IStoryStep[];
}
