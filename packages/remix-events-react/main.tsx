import { useCallback, useEffect, useMemo, useRef } from "react";
import { events, type EventDescriptor, type EventHandler } from "@remix-run/events";

/** EventDescriptor whose handler is specifically CustomEvent<Detail>. */
export type CustomEventDescriptorFor<Detail, TTarget extends EventTarget = EventTarget> = Omit<
    EventDescriptor<TTarget>,
    "handler"
> & {
    handler: EventHandler<CustomEvent<Detail>, TTarget>;
};

/** Convenience alias for EventTarget-bound custom descriptors. */
export type CustomEventDescriptor<Detail> = CustomEventDescriptorFor<Detail, EventTarget>;

/**
 * DOM ref hook (unchanged API; included for completeness).
 */
export function useEventDescriptorRef<T extends Element>(
    on?: EventDescriptor<T> | readonly EventDescriptor<T>[]
) {
    const list = useMemo<readonly EventDescriptor<T>[]>(() => {
        if (!on) return [];
        return Array.isArray(on) ? on : [on];
    }, [on]);

    const containerRef = useRef<ReturnType<typeof events> | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const ref = useCallback((node: T | null) => {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
        containerRef.current = null;

        if (node) {
            containerRef.current = events(node);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (cleanupRef.current) cleanupRef.current();
        cleanupRef.current = list.length > 0 ? container.on(list as EventDescriptor<any>[]) : null;

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [list]);

    useEffect(() => {
        return () => {
            if (cleanupRef.current) cleanupRef.current();
            containerRef.current = null;
        };
    }, []);

    return ref;
}

/**
 * useEventDescriptors — now ONLY generic over Detail.
 * Target is always EventTarget.
 *
 * Accepts only descriptors whose handler is CustomEvent<Detail>.
 * Passing dom./doc./win. descriptors is a type error.
 */
export function useEventDescriptors<Detail>(
    on?: CustomEventDescriptor<Detail> | readonly CustomEventDescriptor<Detail>[]
): (event: CustomEvent<Detail>) => void {
    const list = useMemo<readonly CustomEventDescriptor<Detail>[]>(() => {
        if (!on) return [];
        return (Array.isArray(on) ? on : [on]) as readonly CustomEventDescriptor<Detail>[];
    }, [on]);

    // Stable EventTarget instance (lazy, single-run)
    const targetRef = useRef(() => new EventTarget());

    const containerRef = useRef<ReturnType<typeof events> | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            containerRef.current = events(targetRef.current!);
        }
        if (cleanupRef.current) cleanupRef.current();
        cleanupRef.current = list.length > 0 ? containerRef.current.on(list) : null;

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [list]);

    // Dispatch only accepts CustomEvent<Detail>
    const dispatch = useCallback((event: CustomEvent<Detail>) => {
        targetRef.current!.dispatchEvent(event);
    }, []);

    return dispatch;
}

export type { EventDescriptor } from "@remix-run/events";
