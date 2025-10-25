import type { Remix } from "@remix-run/dom";
import equal from "fast-deep-equal";

type Dispatcher<Value> = (value: Value) => void;

export class Store<Value> {
    #value: Value;
    #listeners = new Set<Dispatcher<Value>>();
    #version = 0; // Track how many times value has changed

    get current(): Value {
        return this.#value;
    }

    get version(): number {
        return this.#version;
    }

    constructor(value: Value) {
        this.#value = value;
    }

    next(value: Partial<Value>, equals = equal) {
        const update = { ...this.#value, ...value };

        if (!equals(this.#value, update)) {
            this.#value = { ...this.#value, ...value };
            this.#version++; // Increment version on every change

            // Notify all listeners about the change
            for (const dispatch of this.#listeners) {
                dispatch(this.#value);
            }
        }
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<Value> {
        // Yield the current value
        let lastYieldedVersion = this.#version;
        yield this.#value;

        // Then yield whenever the value changes
        while (true) {
            // If version changed while we were processing, yield immediately
            if (this.#version !== lastYieldedVersion) {
                lastYieldedVersion = this.#version;
                yield this.#value;
                continue;
            }

            // Otherwise wait for the next change
            const { promise, resolve } = Promise.withResolvers<{
                value: Value;
                version: number;
            }>();

            const dispatch = (newValue: Value) => {
                this.#listeners.delete(dispatch);
                const versionAtResolve = this.#version;
                resolve({ value: newValue, version: versionAtResolve });
            };
            this.#listeners.add(dispatch);

            const { value, version } = await promise;
            yield value;
            lastYieldedVersion = version;
        }
    }
}

/**
 * Combines two async iterables, emitting whenever either one emits.
 * Always uses the latest value from each source.
 */
export async function* combineLatest<T extends unknown[]>(
    ...sources: { [K in keyof T]: AsyncIterable<T[K]> }
): AsyncIterable<T> {
    const n = sources.length;
    const iters = sources.map(s => s[Symbol.asyncIterator]());

    const latest = Array(n) as unknown as T;
    const has = Array(n).fill(false);
    const done = Array(n).fill(false);

    const pending = iters.map((it, i) => it.next().then(r => ({ i, r })));

    while (true) {
        const { i, r } = await Promise.race(pending);
        if (r.done) {
            done[i] = true;
            pending[i] = new Promise(() => {}); // never resolves
            if (done.every(Boolean)) return;
            continue;
        }

        has[i] = true;
        latest[i] = r.value;

        pending[i] = iters[i].next().then(result => ({ i, r: result }));

        if (has.every(Boolean)) {
            yield latest;
        }
    }
}

export interface AsyncHandle<Props> extends Remix.Handle {
    /** Access to the props store for checking current values */
    readonly props: Store<Props>;
}

export function component<Props = Remix.ElementProps>(
    setup: (this: AsyncHandle<Props>) => AsyncGenerator<Remix.RemixNode>,
): Remix.Component<Remix.NoContext, Props, Props> {
    return function (this: Remix.Handle, setupProps: Props) {
        let node: Remix.RemixNode;
        const props = new Store(setupProps);

        const combinedThis = Object.create(this) as AsyncHandle<Props>;

        // Expose the props store directly
        Object.defineProperty(combinedThis, "props", {
            get() {
                return props;
            },
        });

        (async () => {
            for await (const template of setup.call(combinedThis)) {
                node = template;
                this.update();
            }
        })();

        return (renderProps: Props) => {
            props.next(renderProps);
            return node;
        };
    };
}
