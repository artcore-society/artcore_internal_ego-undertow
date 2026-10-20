import type IEnvironmentState from './IEnvironmentState.ts';

export default interface IEnvironmentAware {
	applyEnvironment(state: Readonly<IEnvironmentState>): void;
}
