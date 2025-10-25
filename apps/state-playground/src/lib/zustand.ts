/**
 * Pinia-style store factory for Remix 3
 *
 * @example
 * // Define a store
 * const useCounterStore = store({
 *   state: {
 *     count: 0,
 *     name: 'Mark'
 *   },
 *   getters: {
 *     get doubleCount(): number {
 *       return this.count * 2
 *     }
 *   },
 *   actions: {
 *     increment() {
 *       this.count++
 *     }
 *   }
 * })
 *
 * // Usage 1: Inside a Remix component (auto-updates)
 * function Counter(this: Remix.Handle) {
 *   const counter = useCounterStore(this)
 *   return () => (
 *     <div>
 *       {counter.count} * 2 = {counter.doubleCount}
 *       <button on={dom.click(() => counter.increment())}>+</button>
 *     </div>
 *   )
 * }
 *
 * // Usage 2: Outside a component (listen to updates via events)
 * const counter = useCounterStore()
 * events(counter, [useCounterStore.update(event => {
 *   console.log('Store updated:', event.detail)
 *   // event.detail is typed as the full store instance
 * })])
 */

import type { Remix } from "@remix-run/dom";
import type { EventDescriptor } from "@remix-run/events";
import { createEventType, dom, events } from "@remix-run/events";
import equals from "fast-deep-equal";
import { createStore } from "zustand/vanilla";

// Branded type to make store EventTarget distinct from regular EventTarget
declare const StoreEventTargetBrand: unique symbol;

export interface StoreEventTarget<T> extends EventTarget {
	[StoreEventTargetBrand]: T;
}

/**
 * Type-safe events function for stores
 * Only accepts event descriptors specifically typed for this store
 */
export function storeEvents<T>(
	target: StoreEventTarget<T>,
	descriptors:
		| EventDescriptor<StoreEventTarget<T>>[]
		| EventDescriptor<StoreEventTarget<T>>,
): () => void {
	return events(target, descriptors as any);
}

export function store<
	State extends Record<string, unknown>,
	Getters extends Record<string, unknown>,
	// biome-ignore lint/suspicious/noExplicitAny: needed for flexible action signatures
	Actions extends Record<string, (...args: any[]) => unknown>,
>(config: {
	state: State;
	getters?: Getters & ThisType<State & Getters & Actions>;
	actions?: Actions & ThisType<State & Getters & Actions>;
}) {
	type StoreInstance = State & Getters & Actions;

	const zustandStore = createStore<State>(() => config.state);
	const eventTarget = new EventTarget();

	// Create typed update event
	const [updateBase, createUpdate] =
		createEventType<StoreInstance>("store:update");

	// Create a typed wrapper that returns an EventDescriptor for StoreEventTarget
	const update = <H extends (event: CustomEvent<StoreInstance>) => void>(
		handler: H,
	): EventDescriptor<StoreEventTarget<StoreInstance>> => {
		return updateBase(handler) as EventDescriptor<
			StoreEventTarget<StoreInstance>
		>;
	};

	// Batch updates in a microtask queue
	let updateQueued = false;

	// Subscribe to zustand store changes and dispatch events
	zustandStore.subscribe((state, prev) => {
		if (!equals(prev, state)) {
			if (updateQueued) return;

			updateQueued = true;
			queueMicrotask(() => {
				updateQueued = false;

				const currentState = zustandStore.getState();

				// Create a plain object with state + computed getters for the event
				const snapshot = { ...currentState } as StoreInstance;

				// Add computed getters to the snapshot
				if (config.getters) {
					for (const key in config.getters) {
						const descriptor = Object.getOwnPropertyDescriptor(
							config.getters,
							key,
						);
						if (descriptor?.get) {
							// biome-ignore lint/suspicious/noExplicitAny: dynamic getter assignment
							(snapshot as any)[key] = descriptor.get.call(createStoreProxy());
						}
					}
				}

				eventTarget.dispatchEvent(createUpdate({ detail: snapshot }));
			});
		}
	});

	function createStoreProxy(): StoreInstance {
		return new Proxy({} as StoreInstance, {
			get(_target, prop) {
				const state = zustandStore.getState();

				// Check if it's a getter
				if (config.getters && prop in config.getters) {
					const descriptor = Object.getOwnPropertyDescriptor(
						config.getters,
						prop,
					);
					if (descriptor?.get) {
						return descriptor.get.call(createStoreProxy());
					}
				}

				// Check if it's an action
				if (config.actions && prop in config.actions) {
					const action = config.actions[prop as keyof typeof config.actions];
					if (typeof action === "function") {
						// biome-ignore lint/suspicious/noExplicitAny: preserving action signature
						return (...args: any[]) => action.call(createStoreProxy(), ...args);
					}
				}

				// Return state property
				return state[prop as keyof State];
			},

			set(_target, prop, value) {
				zustandStore.setState({ [prop]: value } as Partial<State>);
				return true;
			},
		});
	}

	function useStore(
		handle?: Remix.Handle,
	): StoreInstance & StoreEventTarget<StoreInstance> {
		if (handle) {
			events(handle.signal, [
				dom.abort(
					zustandStore.subscribe((state, prev) => {
						if (!Object.is(prev, state)) {
							handle.update();
						}
					}),
				),
			]);
		}

		return new Proxy(
			eventTarget as StoreInstance & StoreEventTarget<StoreInstance>,
			{
				get(_target, prop) {
					const state = zustandStore.getState();

					// Check if it's a getter
					if (config.getters && prop in config.getters) {
						const descriptor = Object.getOwnPropertyDescriptor(
							config.getters,
							prop,
						);
						if (descriptor?.get) {
							return descriptor.get.call(createStoreProxy());
						}
					}

					// Check if it's an action
					if (config.actions && prop in config.actions) {
						const action = config.actions[prop as keyof typeof config.actions];
						if (typeof action === "function") {
							// biome-ignore lint/suspicious/noExplicitAny: preserving action signature
							return (...args: any[]) =>
								action.call(createStoreProxy(), ...args);
						}
					}

					// Return state property if it exists
					if (prop in state) {
						return state[prop as keyof State];
					}

					// Return EventTarget methods/properties bound to the actual EventTarget
					const value = _target[prop as keyof EventTarget];
					if (typeof value === "function") {
						return value.bind(_target);
					}
					return value;
				},

				set(_target, prop, value) {
					zustandStore.setState({ [prop]: value } as Partial<State>);
					return true;
				},
			},
		);
	}

	// Attach the update event as a static property
	useStore.update = update;

	return useStore;
}

// type TypedEvent<E = Event, CurrentTarget = any, Target = any> = Omit<
// 	E,
// 	"target" | "currentTarget"
// > & {
// 	target: Target;
// 	currentTarget: CurrentTarget;
// };
