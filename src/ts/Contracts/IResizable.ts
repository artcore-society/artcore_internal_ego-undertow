import type IViewportSize from './IViewportSize.ts';

export default interface IResizable {
	resize(size: IViewportSize): void;
}
