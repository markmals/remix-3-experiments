import type { Remix } from "@remix-run/dom";
import { createReactiveSystem, ReactiveFlags, type ReactiveNode } from "alien-signals/system";
import equal from "fast-deep-equal";

type ClassPropertyContext =
    | ClassAccessorDecoratorContext
    | ClassGetterDecoratorContext
    | ClassFieldDecoratorContext;

type ClassPropertyDecorator = (_target: any, context: ClassPropertyContext) => void;

interface Constructor<T> {
    new (...args: any[]): T;
}

type ObservableDecorator = <Target extends Constructor<any>>(
    TargetCtor: Target,
    context: ClassDecoratorContext,
) => Target;

// ==========================================================================================
// Low-level implementation using `createReactiveSystem`
// ==========================================================================================

interface ObservedProperty<T = any> extends ReactiveNode {
    previousValue: T;
    value: T;
}

interface CachedProperty<T = any> extends ReactiveNode {
    value: T | undefined;
    getter: (previousValue?: T) => T;
}

interface Observer extends ReactiveNode {
    observe(): void;
}

enum ObserverFlags {
    Queued = 1 << 6,
}

const queuedObservers: (Observer | undefined)[] = [];
let queuedObserversLength = 0;
let notifyIndex = 0;
const batchDepth = 0;
let activeSub: ReactiveNode | undefined;

const { link, unlink, propagate, checkDirty, endTracking, startTracking, shallowPropagate } =
    createReactiveSystem({
        update(node: ObservedProperty | CachedProperty): boolean {
            if ("getter" in node) {
                return updateCachedProperty(node);
            } else {
                return updateObservedProperty(node, node.value);
            }
        },
        notify(effect: Observer) {
            const flags = effect.flags;
            if (!(flags & ObserverFlags.Queued)) {
                effect.flags = flags | ObserverFlags.Queued;
                queuedObservers[queuedObserversLength++] = effect;
            }
        },
        unwatched(node: ObservedProperty | CachedProperty | Observer) {
            if ("getter" in node) {
                let toRemove = node.deps;
                if (toRemove !== undefined) {
                    node.flags = (ReactiveFlags.Mutable | ReactiveFlags.Dirty) as ReactiveFlags;
                    do {
                        toRemove = unlink(toRemove, node);
                    } while (toRemove !== undefined);
                }
            } else if (!("previousValue" in node)) {
                // Effect cleanup
                let dep = node.deps;
                while (dep !== undefined) {
                    dep = unlink(dep, node);
                }
                const sub = node.subs;
                if (sub !== undefined) {
                    unlink(sub);
                }
                node.flags = ReactiveFlags.None;
            }
        },
    });

function updateCachedProperty<T>(c: CachedProperty<T>): boolean {
    const prevSub = setCurrentSub(c);
    startTracking(c);
    try {
        const oldValue = c.value;
        return oldValue !== (c.value = c.getter(oldValue));
    } finally {
        setCurrentSub(prevSub);
        endTracking(c);
    }
}

function updateObservedProperty<T>(s: ObservedProperty<T>, value: T): boolean {
    s.flags = ReactiveFlags.Mutable;
    return s.previousValue !== (s.previousValue = value);
}

function setCurrentSub(sub: ReactiveNode | undefined): ReactiveNode | undefined {
    const prevSub = activeSub;
    activeSub = sub;
    return prevSub;
}

function flush(): void {
    while (notifyIndex < queuedObserversLength) {
        const effect = queuedObservers[notifyIndex]!;
        queuedObservers[notifyIndex++] = undefined;
        runEffect(effect, (effect.flags &= ~ObserverFlags.Queued));
    }
    notifyIndex = 0;
    queuedObserversLength = 0;
}

function runEffect(e: Observer, flags: ReactiveFlags): void {
    if (flags & ReactiveFlags.Dirty || (flags & ReactiveFlags.Pending && checkDirty(e.deps!, e))) {
        const prev = setCurrentSub(e);
        startTracking(e);
        try {
            e.observe();
        } finally {
            setCurrentSub(prev);
            endTracking(e);
        }
    } else if (flags & ReactiveFlags.Pending) {
        e.flags = flags & ~ReactiveFlags.Pending;
    }
}

const IGNORED_PROPERTIES = new WeakSet();

export function observable(): ObservableDecorator {
    return <Target extends Constructor<any>>(TargetCtor: Target): Target =>
        class extends TargetCtor {
            constructor(...args: any[]) {
                super(...args);

                // Transform all enumerable properties into signals
                const prototype = Object.getPrototypeOf(this);
                const descriptors = Object.getOwnPropertyDescriptors(prototype);

                for (const [key, descriptor] of Object.entries(descriptors)) {
                    if (key === "constructor" || IGNORED_PROPERTIES.has(descriptor)) {
                        continue;
                    }

                    if (descriptor.get && !descriptor.set) {
                        // Transform getter into cached property
                        const cachedProperty: CachedProperty = {
                            value: undefined,
                            subs: undefined,
                            subsTail: undefined,
                            deps: undefined,
                            depsTail: undefined,
                            flags: (ReactiveFlags.Mutable | ReactiveFlags.Dirty) as ReactiveFlags,
                            getter: () => descriptor.get!.call(this),
                        };
                        Object.defineProperty(this, key, {
                            get() {
                                const flags = cachedProperty.flags;
                                if (
                                    flags & ReactiveFlags.Dirty ||
                                    (flags & ReactiveFlags.Pending &&
                                        checkDirty(cachedProperty.deps!, cachedProperty))
                                ) {
                                    if (updateCachedProperty(cachedProperty)) {
                                        const subs = cachedProperty.subs;
                                        if (subs !== undefined) {
                                            shallowPropagate(subs);
                                        }
                                    }
                                } else if (flags & ReactiveFlags.Pending) {
                                    cachedProperty.flags = flags & ~ReactiveFlags.Pending;
                                }
                                if (activeSub !== undefined) {
                                    link(cachedProperty, activeSub);
                                }
                                return cachedProperty.value!;
                            },
                            enumerable: true,
                            configurable: true,
                        });
                    }
                }

                // Transform instance properties into observed properties
                const initialValues = Object.getOwnPropertyDescriptors(this);
                for (const [key, descriptor] of Object.entries(initialValues)) {
                    if (
                        typeof descriptor.value !== "undefined" &&
                        !IGNORED_PROPERTIES.has(descriptor) &&
                        typeof descriptor.value !== "function"
                    ) {
                        const observedProperty: ObservedProperty = {
                            previousValue: descriptor.value,
                            value: descriptor.value,
                            subs: undefined,
                            subsTail: undefined,
                            flags: ReactiveFlags.Mutable,
                        };
                        Object.defineProperty(this, key, {
                            get() {
                                const value = observedProperty.value;
                                if (observedProperty.flags & ReactiveFlags.Dirty) {
                                    if (updateObservedProperty(observedProperty, value)) {
                                        const subs = observedProperty.subs;
                                        if (subs !== undefined) {
                                            shallowPropagate(subs);
                                        }
                                    }
                                }
                                if (activeSub !== undefined) {
                                    link(observedProperty, activeSub);
                                }
                                return value;
                            },
                            set(value) {
                                if (observedProperty.value !== value) {
                                    observedProperty.value = value;
                                    observedProperty.flags = (ReactiveFlags.Mutable |
                                        ReactiveFlags.Dirty) as ReactiveFlags;
                                    const subs = observedProperty.subs;
                                    if (subs !== undefined) {
                                        propagate(subs);
                                        if (!batchDepth) {
                                            flush();
                                        }
                                    }
                                }
                            },
                            enumerable: true,
                            configurable: true,
                        });
                    }
                }
            }
        };
}

export function observationIgnored(): ClassPropertyDecorator {
    return (_target: any, context: ClassPropertyContext): void => {
        context.addInitializer(function () {
            const descriptor =
                Object.getOwnPropertyDescriptor(this, context.name) ||
                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), context.name);
            if (descriptor) {
                IGNORED_PROPERTIES.add(descriptor);
            }
        });
    };
}

export function withObservationTracking(onChange: () => void): void {
    const observer: Observer = {
        observe: onChange,
        subs: undefined,
        subsTail: undefined,
        deps: undefined,
        depsTail: undefined,
        flags: ReactiveFlags.Watching,
    };
    const prev = setCurrentSub(observer);
    try {
        observer.observe();
    } finally {
        setCurrentSub(prev);
    }
}

export function ignoringObservation<T>(nonReactiveReadsFn: () => T): T {
    const prev = setCurrentSub(undefined);
    try {
        return nonReactiveReadsFn();
    } finally {
        setCurrentSub(prev);
    }
}

export function component<Props extends object = Remix.ElementProps>(
    setup: (props: Props) => () => Remix.RemixNode,
): Remix.Component<Remix.NoContext, Props, Props> {
    return function (this: Remix.Handle, setupProps: Props) {
        // Create observable properties for props (lazy creation)
        const observedProps = new Map<keyof Props, ObservedProperty>();
        let lastRenderProps = setupProps;

        // Track whether we're in the render function
        let isRendering = false;

        // Create a proxy that returns observable values
        const propsProxy = new Proxy(setupProps, {
            get(_target, prop: string | symbol) {
                const key = prop as keyof Props;
                let observed = observedProps.get(key);
                if (!observed) {
                    observed = {
                        previousValue: setupProps[key],
                        value: setupProps[key],
                        subs: undefined,
                        subsTail: undefined,
                        flags: ReactiveFlags.Mutable,
                    };
                    observedProps.set(key, observed);
                }

                // Only track dependency if we're NOT in the main render
                // (allow tracking in withObservationTracking callbacks)
                if (activeSub !== undefined && !isRendering) {
                    link(observed, activeSub);
                }

                return observed.value;
            },
        });

        // Run setup once with the observable proxy
        const render = setup(propsProxy);

        // Create observer that triggers updates when @observable() dependencies change
        const observer: Observer = {
            observe: () => this.update(),
            subs: undefined,
            subsTail: undefined,
            deps: undefined,
            depsTail: undefined,
            flags: ReactiveFlags.Watching,
        };

        // Return render function with dependency tracking
        return (renderProps: Props) => {
            // Fast path: skip prop updates if props haven't changed
            if (!equal(lastRenderProps, renderProps)) {
                lastRenderProps = renderProps;

                // Update only changed props
                for (const key in renderProps) {
                    const observed = observedProps.get(key);
                    const newValue = renderProps[key];

                    if (observed && observed.value !== newValue) {
                        observed.value = newValue;
                        observed.flags = (ReactiveFlags.Mutable |
                            ReactiveFlags.Dirty) as ReactiveFlags;
                        const subs = observed.subs;
                        if (subs !== undefined) {
                            propagate(subs);
                        }
                    }
                }

                // Flush all pending updates
                flush();
            }

            // Track reactive reads during render (for @observable() classes only, not props)
            isRendering = true;
            const prev = setCurrentSub(observer);
            startTracking(observer);
            try {
                return render();
            } finally {
                isRendering = false;
                setCurrentSub(prev);
                endTracking(observer);
            }
        };
    };
}
