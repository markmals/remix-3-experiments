import type { Remix } from "@remix-run/dom";
import equals from "fast-deep-equal";

type Dispatcher<Value> = (value: Value) => void;

export class AsyncStore<Value> {
    #value: Value;
    #listeners = new Set<Dispatcher<Value>>();

    get current(): Value {
        return this.#value;
    }

    constructor(value: Value) {
        this.#value = value;
    }

    send(value: Partial<Value>) {
        const update = { ...this.#value, ...value };

        if (!equals(this.#value, update)) {
            this.#value = { ...this.#value, ...value };

            // Notify all listeners about the change
            for (const dispatch of this.#listeners) {
                dispatch(this.#value);
            }
        }
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<Value> {
        // Yield the current value
        yield this.#value;

        // Then yield whenever the value changes
        while (true) {
            const { promise: value, resolve } = Promise.withResolvers<Value>();

            const dispatch = (newValue: Value) => {
                this.#listeners.delete(dispatch);
                resolve(newValue);
            };
            this.#listeners.add(dispatch);

            yield await value;
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

export function component<Props = Remix.ElementProps>(
    setup: (props: AsyncIterable<Props>) => AsyncGenerator<Remix.RemixNode>,
): Remix.Component<Remix.NoContext, Props, Props> {
    return function (this: Remix.Handle, setupProps: Props) {
        let node: Remix.RemixNode;
        const props = new AsyncStore(setupProps);

        (async () => {
            for await (const template of setup(props)) {
                node = template;
                this.update();
            }
        })();

        return (renderProps: Props) => {
            props.send(renderProps);
            return node;
        };
    };
}
