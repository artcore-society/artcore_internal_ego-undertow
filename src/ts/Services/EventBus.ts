type Listener<TPayload> = (payload: TPayload) => void;

/** Minimal strongly typed publish/subscribe channel. */
export default class EventBus<TEventMap extends object> {
	private readonly _listeners = new Map<keyof TEventMap, Set<Listener<never>>>();

	public on<TKey extends keyof TEventMap>(event: TKey, listener: Listener<TEventMap[TKey]>): () => void {
		let listeners = this._listeners.get(event);

		if (!listeners) {
			listeners = new Set();
			this._listeners.set(event, listeners);
		}

		listeners.add(listener as Listener<never>);

		return () => this.off(event, listener);
	}

	public off<TKey extends keyof TEventMap>(event: TKey, listener: Listener<TEventMap[TKey]>): void {
		this._listeners.get(event)?.delete(listener as Listener<never>);
	}

	public emit<TKey extends keyof TEventMap>(event: TKey, payload: TEventMap[TKey]): void {
		this._listeners.get(event)?.forEach((listener) => (listener as Listener<TEventMap[TKey]>)(payload));
	}

	public clear(): void {
		this._listeners.clear();
	}
}
