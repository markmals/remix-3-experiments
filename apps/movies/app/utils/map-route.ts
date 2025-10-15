import type { InferRouteHandler, Route, Router } from "@remix-run/fetch-router";

type RouteLike = Route | string;

type HandlerReturn<T extends RouteLike> = InferRouteHandler<T>;
type HandlerCallable<T extends RouteLike> = Extract<
	HandlerReturn<T>,
	(...args: any[]) => any
>;
type HandlerContext<T extends RouteLike> = Parameters<HandlerCallable<T>>[0];
type LoadedModule<T extends RouteLike> = Promise<
	{
		default?: HandlerReturn<T>;
		handler?: HandlerReturn<T>;
	} & Record<string, unknown>
>;

function invokeHandler<T extends RouteLike>(
	handler: HandlerReturn<T>,
	context: HandlerContext<T>,
) {
	if (typeof handler === "function") {
		return handler(context);
	}

	return handler.handler(context);
}

export function lazyMap<T extends RouteLike>(
	router: Router,
	route: T,
	load: () => LoadedModule<T>,
) {
	router.map(route, async (context) => {
		const mod = await load();
		const handler = (mod.default ?? mod.handler) as HandlerReturn<T>;
		return invokeHandler(handler, context);
	});
}
