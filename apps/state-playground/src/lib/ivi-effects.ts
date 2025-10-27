import type { Remix } from "@remix-run/dom";
import { dom, events } from "@remix-run/events";

export type Effect = {
    (
        handle: Remix.Handle,
        effect: () => (() => void) | void,
        areEqual?: (prev?: any, next?: any) => boolean,
    ): () => void;
    <P>(
        handle: Remix.Handle,
        effect: (props: P) => (() => void) | void,
        areEqual?: (prev: P, next: P) => boolean,
    ): (props: P) => void;
};

/**
 * Creates a side effect hook.
 *
 * @example
 *
 *     const Example = component((c) => {
 *       const [count, setCount] = useState(c, 0);
 *       const timer = useEffect(c, ({ interval }) => {
 *         const tid = setInterval(() => { setCount(count() + 1); }, interval);
 *         return () => { clearInterval(tid); };
 *       }, shallowEq);
 *
 *       return (interval) => (
 *         timer({ interval }),
 *
 *         html`<span>${count()}</span>`
 *       );
 *     });
 *
 * @typeparam T Hook props type.
 * @param component Component instance.
 * @param hook Side effect function.
 * @param areEqual Function that checks if input value hasn't changed.
 * @returns Side effect hook.
 */
export const useEffect: Effect = <P>(
    handle: Remix.Handle,
    hook: (props?: P) => (() => void) | void,
    areEqual?: (prev: P, next: P) => boolean,
): ((props?: P) => void) => {
    // var usage is intentional, see `docs/internals/perf.md` for an explanation.
    var reset: (() => void) | void;
    var prev: P | undefined;
    var pending: boolean | undefined;
    return (next?: P) => {
        if (
            pending !== true &&
            (areEqual === void 0 || prev === void 0 || areEqual(prev as P, next as P) === false)
        ) {
            if (pending === void 0) {
                events(handle.signal, [
                    dom.abort(() => {
                        pending = false;
                        if (reset !== void 0) {
                            reset();
                        }
                    }),
                ]);
            }
            pending = true;
            // FIXME: Can I even replicate this in Remix?
            // ivi uses it in a _flushDOMEffects function which is called inside of _dirtyCheckRoot
            // RENDER_CONTEXT.e.push(() => {
            //     if (pending === true) {
            //         pending = false;
            //         if (reset !== void 0) {
            //             reset();
            //         }
            //         reset = hook(next!);
            //     }
            // });
        }
        prev = next;
    };
};

let _animationFrameEffects: (() => void)[] = [];
let _idleEffects: (() => void)[] = [];

const _flushAnimationFrameEffects = () => {
    while (_animationFrameEffects.length > 0) {
        const e = _animationFrameEffects;
        _animationFrameEffects = [];
        for (let i = 0; i < e.length; i++) {
            e[i]();
        }
    }
};

const _flushIdleEffects = () => {
    while (_idleEffects.length > 0) {
        const e = _idleEffects;
        _idleEffects = [];
        for (let i = 0; i < e.length; i++) {
            e[i]();
        }
    }
};

/* @__NO_SIDE_EFFECTS__ */
export const createEffectHandler =
    (scheduleFlushTask: () => Array<() => void>) =>
    <P>(
        handle: Remix.Handle,
        hook: (props?: P) => (() => void) | void,
        areEqual?: (prev: P, next: P) => boolean,
    ): ((props?: P) => void) => {
        // var usage is intentional, see `docs/internals/perf.md` for an explanation.
        var reset: (() => void) | void;
        var prev: P | undefined;
        var pending: boolean | undefined;
        return (next?: P) => {
            if (
                pending !== true &&
                (areEqual === void 0 || prev === void 0 || areEqual(prev as P, next as P) === false)
            ) {
                if (pending === void 0) {
                    events(handle.signal, [
                        dom.abort(() => {
                            pending = false;
                            if (reset !== void 0) {
                                reset();
                            }
                        }),
                    ]);
                }
                pending = true;
                scheduleFlushTask().push(() => {
                    if (pending === true) {
                        pending = false;
                        if (reset !== void 0) {
                            reset();
                        }
                        reset = hook(next!);
                    }
                });
            }
            prev = next;
        };
    };

const _scheduleAnimationFrameEffects = () => {
    const queue = _animationFrameEffects;
    if (queue.length === 0) {
        requestAnimationFrame(_flushAnimationFrameEffects);
    }
    return queue;
};
export const useAnimationFrameEffect = createEffectHandler(_scheduleAnimationFrameEffects);

const _scheduleIdleEffects = () => {
    const queue = _idleEffects;
    if (queue.length === 0) {
        requestIdleCallback(_flushIdleEffects);
    }
    return queue;
};
export const useIdleEffect = createEffectHandler(_scheduleIdleEffects);
