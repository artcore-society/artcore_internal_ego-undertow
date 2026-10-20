import type { IUniform } from 'three';

/** Maps a plain value interface to a strongly typed uniforms object. */
export type TypedUniforms<TValues> = { [TKey in keyof TValues]: IUniform<TValues[TKey]> };
