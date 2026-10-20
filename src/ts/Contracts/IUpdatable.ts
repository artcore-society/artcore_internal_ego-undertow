import type IFrameContext from './IFrameContext.ts';

export default interface IUpdatable {
	update(frame: IFrameContext): void;
}
