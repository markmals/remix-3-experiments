import type { Remix } from "@remix-run/dom";
import { Catch } from "@remix-run/dom";
import { createEventType, events } from "@remix-run/events";

const [change, createChange] = createEventType("rmx-suspense:change");

export class SuspenseState extends EventTarget {
    static change = change;

    result: any | undefined;
    error: unknown | undefined;

    async registerPromise(error: Error) {
        this.result = undefined;
        this.error = undefined;

        if (error instanceof Promise) {
            try {
                const value = await error;
                this.result = value;
                this.dispatchEvent(createChange());
            } catch (err) {
                this.error = err;
                this.dispatchEvent(createChange());
            }
        }

        throw error;
    }
}

export namespace Suspense {
    export interface Props {
        fallback: Remix.RemixNode;
        children: Remix.RemixNode;
    }
}

/**
 * Minimal Suspense implementation built on top of `<Catch>`.
 *
 * Any promise thrown during child rendering is caught and renders the provided fallback.
 * Non-promise errors are rethrown so outer boundaries can handle them.
 */
export function Suspense(this: Remix.Handle<SuspenseState>) {
    const state = new SuspenseState();
    events(state, [
        SuspenseState.change(() => {
            if (this.signal.aborted) return;
            this.update();
        }),
    ]);
    this.context.set(state);

    return ({ fallback, children }: Suspense.Props) => {
        return (
            <Catch
                fallback={error => {
                    state.registerPromise(error);
                    return fallback;
                }}
            >
                {children}
            </Catch>
        );
    };
}
