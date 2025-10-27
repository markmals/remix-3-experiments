import type { Remix } from "@remix-run/dom";
import { createEventType, dom, events } from "@remix-run/events";
import { Suspense, SuspenseState } from "./suspense.tsx";

/**
 * Prevents triggering updates.
 */
export const preventUpdates = (a: any, b: any) => true;

/**
 * Checks if values are equal with a strict equality operator `===`.
 *
 * @param a
 * @param b
 * @returns True when values are strictly equal.
 */
export const strictEq = <T>(a: T, b: T): boolean => a === b;

const objectKeys = Object.keys;

/**
 * Checks if objects are shallow equal.
 *
 * shallowEq algorithm is using strict equality operator `===` to
 * compare object values.
 *
 * @param a
 * @param b
 * @returns True when objects are shallow equal.
 */
export const shallowEq = <T extends object>(a: T, b: T): boolean => {
    if (a !== b) {
        const aKeys = objectKeys(a);
        const bKeys = objectKeys(b);

        if (aKeys.length !== bKeys.length) {
            return false;
        }

        for (let i = 0; i < aKeys.length; ++i) {
            const key = aKeys[i];
            if ((a as any)[key] !== (b as any)[key]) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Checks if arrays are shallow equal.
 *
 * shallowEqArray algorithm is using strict equality operator `===` to
 * compare array values.
 *
 * @param a
 * @param b
 * @returns True whan arrays are shallow equal.
 */
export const shallowEqArray = <T>(a: T[], b: T[]): boolean => {
    if (a !== b) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
    }

    return true;
};

type Accessor<T> = () => T;
type Dispatch<A> = (next: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);

type AnyActionArg = [] | [any];
type ActionDispatch<ActionArg extends AnyActionArg> = (...args: ActionArg) => void;
type Reducer<S, A> = (prevState: S, action: A) => S;
// type ReducerWithoutAction<S> = (prevState: S) => S;

/**
 * `useReducer` is usually preferable to `useState` when you have complex state logic that involves
 * multiple sub-values. It also lets you optimize performance for components that trigger deep
 * updates because you can pass `dispatch` down instead of callbacks.
 */
export function useReducer<S, A extends AnyActionArg>(
    handle: Remix.Handle,
    reducer: Reducer<S, A>,
    initialState: S,
): [Accessor<S>, ActionDispatch<A>];
export function useReducer<S, I, A extends AnyActionArg>(
    handle: Remix.Handle,
    reducer: Reducer<S, A>,
    initialArg: I,
    init: (i: I) => S,
): [Accessor<S>, ActionDispatch<A>];
export function useReducer<S, I, A extends AnyActionArg>(
    handle: Remix.Handle,
    reducer: Reducer<S, A>,
    state: any,
    init?: (i: I) => S,
): [Accessor<S>, ActionDispatch<A>] {
    // Initialize state properly
    let currentState = init !== undefined ? init(state as I) : state;

    return [
        () => currentState,
        (...args: A) => {
            const nextState = reducer(currentState, args as A);
            if (currentState !== nextState) {
                currentState = nextState;
                handle.update();
            }
        },
    ];
}

/**
 * Returns a stateful value accessor, and a function to update it.
 */
export function useState<S>(
    handle: Remix.Handle,
    initialState: S,
): [Accessor<S>, Dispatch<SetStateAction<S>>];
export function useState<S = undefined>(
    handle: Remix.Handle,
): [Accessor<S | undefined>, Dispatch<SetStateAction<S | undefined>>];
export function useState<S>(
    handle: Remix.Handle,
    state?: S,
): [Accessor<S | undefined>, Dispatch<SetStateAction<S>>] {
    const reducer = (prevState: S | undefined, action: [SetStateAction<S>]): S | undefined => {
        const newValue = action[0];
        return typeof newValue === "function"
            ? (newValue as (prevState: S | undefined) => S)(prevState)
            : newValue;
    };

    return useReducer(handle, reducer, state);
}

/**
 * Creates a memoized function.
 *
 * @example
 *
 *     function Example(this: Remix.Handle) {
 *       const fullName = useMemo(shallowEqArray, ([firstName, lastName]) => (
 *         `${firstName} ${lastName}`
 *       ));
 *
 *       return ({ firstName, lastName }) => (
 *          <div class="fullName">{fullName([firstName, lastName])}</div>
 *       );
 *     });
 *
 * @typeparam T Input type.
 * @typeparam U Output type.
 * @param areEqual Function that checks if input value hasn't changed.
 * @param fn Function to memoize.
 * @returns Memoized function.
 */
export const useMemo = <T, U>(
    areEqual: (prev: T, next: T) => boolean,
    fn: (props: T) => U,
): ((props: T) => U) => {
    var prev: T | undefined;
    var v: U | undefined;
    return (props: T) =>
        v === void 0 || areEqual(prev!, props) === false ? (v = fn((prev = props))) : v;
};

const STORE = Symbol.for("rmx-store");

class StoreImpl<Value, Action> extends EventTarget {
    [STORE] = undefined as never;

    #value: Value;
    #reducer?: (previousValue: Value, action: Action) => Value;
    #areEqual?: (prev: Value, next: Value) => boolean;

    next;
    #createNext;

    constructor(
        initialValue: Value,
        reducer?: (previousValue: Value, action: Action) => Value,
        areEqual?: (prev: Value, next: Value) => boolean,
    ) {
        super();
        this.#value = initialValue;
        this.#reducer = reducer;
        this.#areEqual = areEqual;

        const [next, createNext] = createEventType<Value>("rmx-store:next");
        this.next = next;
        this.#createNext = createNext;
    }

    getSnapshot(): Value {
        return this.#value;
    }

    update(action: Action): void {
        const newValue = this.#reducer
            ? this.#reducer(this.#value, action)
            : (action as unknown as Value);

        // Use custom equality comparator if provided, otherwise use strict equality
        const hasChanged = this.#areEqual
            ? !this.#areEqual(this.#value, newValue)
            : newValue !== this.#value;

        if (hasChanged) {
            this.#value = newValue;
            this.dispatchEvent(this.#createNext({ detail: this.#value }));
        }
    }
}

/**
 * The return value of `createStore`.
 */
export interface Store<out Value, in Action> {
    // private brand because only values from `createStore` are useable,
    // not arbitrary objects matching the shape.
    [STORE]: never;
    update: (action: Action) => void;
}

export function createStore<Value>(
    initialValue: Value,
    areEqual?: (prev: Value, next: Value) => boolean,
): Store<Value, Value>;
export function createStore<Value>(
    initialValue: Value,
    reducer: (previousValue: Value) => Value,
    areEqual?: (prev: Value, next: Value) => boolean,
): Store<Value, void>;
export function createStore<Value, Action>(
    initialValue: Value,
    reducer?: (previousValue: Value, action: Action) => Value,
    areEqual?: (prev: Value, next: Value) => boolean,
): Store<Value, Action>;
export function createStore<Value, Action>(
    initialValue: Value,
    reducer?: (previousValue: Value, action: Action) => Value,
    areEqual?: (prev: Value, next: Value) => boolean,
): Store<Value, Action> {
    return new StoreImpl(initialValue, reducer, areEqual);
}

type ComponentLike =
    | Remix.Component<any, any, any>
    | ((this: Remix.Handle<any>, ...args: any[]) => any);

type ContextFrom<ComponentType> = ComponentType extends Remix.Component<infer Provided, any, any>
    ? Provided
    : ComponentType extends (this: Remix.Handle<infer Provided>, ...args: any[]) => any
      ? Provided
      : never;

type Usable<T> = PromiseLike<T> | Store<T, any>;

// How do we deal with not having <Suspense> in Remix?
// Can we build something like it that works with `use()`?
export function use<T>(handle: Remix.Handle, promise: PromiseLike<T>): Accessor<T>;
export function use<ComponentType extends ComponentLike>(
    handle: Remix.Handle,
    component: ComponentType,
): Accessor<ContextFrom<ComponentType>>;
export function use<T>(handle: Remix.Handle, store: Store<T, any>): Accessor<T>;
export function use<T>(handle: Remix.Handle, contextKey: symbol): Accessor<T | undefined>;
export function use(
    handle: Remix.Handle,
    usable: Usable<unknown> | symbol | ComponentLike,
): Accessor<any> {
    if (usable instanceof StoreImpl) {
        let state = usable.getSnapshot();

        const disposeStore = events(usable, [
            usable.next(event => {
                state = event.detail;
                handle.update();
            }),
        ]);
        const disposeAbort = events(handle.signal, [
            dom.abort(() => {
                disposeStore();
                disposeAbort();
            }),
        ]);

        return () => state;
    }

    if (typeof usable === "function") {
        return () => handle.context.get(usable);
    }

    // Handle PromiseLike<T>
    if (!usable || typeof (usable as PromiseLike<unknown>).then !== "function") {
        throw new TypeError("use() received an unsupported value");
    }

    const promise = Promise.resolve(usable as PromiseLike<unknown>);
    const state = handle.context.get(Suspense);

    return () => {
        // if (handle.signal.aborted) return;

        if (state.result) {
            return state.result;
        }

        if (state.error) {
            throw state.error;
        }

        // Still pending - surface the promise so Suspense fallback can render.
        throw promise;
    };
}

// Symbol to track if handle.update has been wrapped for optimistic updates
const OPTIMISTIC_HOOKS = Symbol.for("useOptimistic.hooks");

interface OptimisticHook {
    updatesSinceDispatch: number;
    isOptimistic: boolean;
    isDispatchingUpdate: boolean;
    reset: () => void;
}

export function useOptimistic<State>(
    handle: Remix.Handle,
    passthrough: Accessor<State>,
): [state: Accessor<State>, dispatch: (action: State | ((pendingState: State) => State)) => void];
export function useOptimistic<State, Action>(
    handle: Remix.Handle,
    passthrough: Accessor<State>,
    reducer: (state: State, action: Action) => State,
): [state: Accessor<State>, dispatch: (action: Action) => void];
export function useOptimistic<State, Action>(
    handle: Remix.Handle,
    passthrough: Accessor<State>,
    reducer?: (state: State, action: Action) => State,
): [state: Accessor<State>, dispatch: (action: Action) => void] {
    let optimisticState: State | undefined;
    let isOptimistic = false;
    let prevPassthrough: State | undefined;
    let updatesSinceDispatch = 0;

    // Create a hook instance for this useOptimistic call
    const hookId = Symbol("optimistic-hook");
    const hookInstance: OptimisticHook = {
        updatesSinceDispatch: 0,
        isOptimistic: false,
        isDispatchingUpdate: false,
        reset: () => {
            isOptimistic = false;
            optimisticState = undefined;
            prevPassthrough = passthrough();
        },
    };

    // Initialize the hooks registry on the handle if it doesn't exist
    if (!(handle as any)[OPTIMISTIC_HOOKS]) {
        (handle as any)[OPTIMISTIC_HOOKS] = new Map<symbol, OptimisticHook>();

        // Wrap handle.update() to auto-reset all optimistic hooks
        const originalUpdate = handle.update.bind(handle);
        handle.update = () => {
            const hooks: Map<symbol, OptimisticHook> = (handle as any)[OPTIMISTIC_HOOKS];

            // Check each optimistic hook
            hooks.forEach(hook => {
                // Only count updates that are NOT from dispatch itself
                // This prevents resetting when multiple optimistic updates happen in sequence
                if (!hook.isDispatchingUpdate) {
                    hook.updatesSinceDispatch++;

                    // If this is the second "real" update after a dispatch, reset the optimistic state
                    if (hook.updatesSinceDispatch > 1 && hook.isOptimistic) {
                        hook.reset();
                    }
                }
            });

            originalUpdate();
        };
    }

    // Register this hook instance
    const hooks: Map<symbol, OptimisticHook> = (handle as any)[OPTIMISTIC_HOOKS];
    hooks.set(hookId, hookInstance);

    const dispatch = (action: Action) => {
        const currentPassthrough = passthrough();
        updatesSinceDispatch = 0;
        hookInstance.updatesSinceDispatch = 0; // Reset counter when dispatch is called
        isOptimistic = true;
        hookInstance.isOptimistic = true;

        if (reducer) {
            optimisticState = reducer(currentPassthrough, action);
        } else {
            // Without a reducer, the action is the new state or a state updater
            const actionAsStateUpdate = action as unknown as
                | State
                | ((pendingState: State) => State);
            optimisticState =
                typeof actionAsStateUpdate === "function"
                    ? (actionAsStateUpdate as (pendingState: State) => State)(currentPassthrough)
                    : actionAsStateUpdate;
        }
        prevPassthrough = currentPassthrough;

        // Mark that this update is from dispatch, not from user code
        hookInstance.isDispatchingUpdate = true;
        handle.update();
        hookInstance.isDispatchingUpdate = false;
    };

    const getState = () => {
        const currentPassthrough = passthrough();

        // Auto-reset logic:
        // 1. If passthrough changed, reset (covers success case where value changes)
        // 2. If updatesSinceDispatch >= 1, reset (covers failure case where value stays same)
        //    We check >= 1 because the first user-triggered this.update() after dispatch
        //    should clear the optimistic state
        const shouldReset =
            (prevPassthrough !== undefined && currentPassthrough !== prevPassthrough) ||
            hookInstance.updatesSinceDispatch >= 1;

        if (shouldReset && isOptimistic) {
            isOptimistic = false;
            hookInstance.isOptimistic = false;
            optimisticState = undefined;
            prevPassthrough = currentPassthrough;
        }

        // If there's an optimistic state, return it
        if (isOptimistic && optimisticState !== undefined) {
            return optimisticState;
        }

        // Otherwise return the passthrough
        return currentPassthrough;
    };

    return [getState, dispatch];
}

export function useActionState<State>(
    handle: Remix.Handle,
    action: (state: Awaited<State>) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string,
): [state: Accessor<Awaited<State>>, dispatch: () => void, isPending: Accessor<boolean>];
export function useActionState<State, Payload>(
    handle: Remix.Handle,
    action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string,
): [
    state: Accessor<Awaited<State>>,
    dispatch: (payload: Payload) => void,
    isPending: Accessor<boolean>,
];
export function useActionState<State, Payload>(
    handle: Remix.Handle,
    action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string,
): [
    state: Accessor<Awaited<State>>,
    dispatch: (payload: Payload) => void,
    isPending: Accessor<boolean>,
] {
    let state: Awaited<State> = initialState;
    let isPending = false;

    const dispatch = async (payload?: Payload) => {
        isPending = true;
        handle.update();

        try {
            const result = await action(state, payload as Payload);
            if (handle.signal.aborted) return;

            state = result as Awaited<State>;
            isPending = false;
            handle.update();
        } catch (error) {
            if (handle.signal.aborted) return;
            isPending = false;
            handle.update();
            throw error;
        }
    };

    return [() => state, dispatch as (payload: Payload) => void, () => isPending];
}

export interface FormStatusNotPending {
    pending: false;
    data: null;
    method: null;
    action: null;
}

export interface FormStatusPending {
    pending: true;
    data: FormData;
    method: string;
    action: string | ((formData: FormData) => void | Promise<void>);
}

export type FormStatus = FormStatusPending | FormStatusNotPending;

const FORM_STATUS_CONTEXT_KEY = Symbol.for("rmx-form-status");

/**
 * Hook to read form submission status. This requires a parent form component
 * to provide form status via context using `createFormStatusStore()`.
 *
 * @example
 * // In parent form:
 * function MyForm(this: Remix.Handle<Store<FormStatus, FormStatus>>) {
 *   const formStatus = createFormStatusStore();
 *   this.context.set(formStatus);
 *
 *   return () => (
 *     <form on={dom.submit(async (e) => {
 *       const formData = new FormData(e.currentTarget);
 *       formStatus.update({ pending: true, data: formData, method: 'POST', action: '/submit' });
 *       await submitForm(formData);
 *       formStatus.update({ pending: false, data: null, method: null, action: null });
 *     })}>
 *       <SubmitButton />
 *     </form>
 *   );
 * }
 *
 * // In child component:
 * function SubmitButton(this: Remix.Handle) {
 *   const status = useFormStatus(this);
 *   return () => (
 *     <button disabled={status().pending}>
 *       {status().pending ? 'Submitting...' : 'Submit'}
 *     </button>
 *   );
 * }
 */
export function useFormStatus(handle: Remix.Handle): Accessor<FormStatus> {
    // Try to get form status store from context
    const store = handle.context.get(FORM_STATUS_CONTEXT_KEY as any) as
        | Store<FormStatus, FormStatus>
        | undefined;

    if (store) {
        return use(handle, store);
    }

    // Return default not-pending status if no form status store in context
    return () => ({ pending: false, data: null, method: null, action: null });
}

/**
 * Creates a form status store that can be provided via context to child components.
 * Use this in form components to track submission state.
 */
export function createFormStatusStore(): Store<FormStatus, FormStatus> {
    return createStore<FormStatus>({ pending: false, data: null, method: null, action: null });
}

let idCounter = 0;

/**
 * Generates a unique ID that is stable across renders.
 * Useful for associating form labels with inputs and ARIA attributes.
 *
 * @example
 * function MyInput(this: Remix.Handle) {
 *   const id = useId();
 *   return () => (
 *     <>
 *       <label for={id}>Email:</label>
 *       <input id={id} type="email" />
 *     </>
 *   );
 * }
 *
 * @returns A unique ID string
 */
export function useId(): string {
    // Generate a unique ID once and return the same ID on every call
    // This is called once during component setup, not during render
    return `rmx-${++idCounter}`;
}
