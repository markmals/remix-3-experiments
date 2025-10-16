/** biome-ignore-all lint/suspicious/noExplicitAny: Type coercison */
import type {
	InferRouteHandler,
	Middleware,
	RequestContext,
	RequestHandler,
	Route,
	Router,
} from "@remix-run/fetch-router";

type RouteLike = Route | string;

type HandlerReturn<T extends RouteLike> = InferRouteHandler<T>;
type HandlerWithMiddleware = {
	use: Middleware<any, any>[];
	handler: RequestHandler<any, any>;
};
type PlainHandler = RequestHandler<any, any>;
type AnyRequestContext = RequestContext<any, any>;

async function runHandlerWithMiddleware(
	handler: HandlerWithMiddleware,
	context: AnyRequestContext,
) {
	const { use, handler: requestHandler } = handler;

	let index = -1;
	const dispatch = async (i: number): Promise<Response> => {
		if (i <= index) throw new Error("next() called multiple times");
		index = i;

		const middleware = use[i];
		if (!middleware) {
			return requestHandler(context);
		}

		let nextPromise: Promise<Response> | undefined;
		const next = (moreContext?: Partial<AnyRequestContext>) => {
			if (moreContext) {
				Object.assign(
					context as unknown as Record<string, unknown>,
					moreContext,
				);
			}

			nextPromise = dispatch(i + 1);
			return nextPromise;
		};

		const response = await middleware(context, next);
		if (response instanceof Response) {
			return response;
		}

		if (nextPromise) {
			return nextPromise;
		}

		return next();
	};

	return dispatch(0);
}

export async function lazyMap<T extends RouteLike>(
	router: Router,
	route: T,
	load: () => Promise<HandlerReturn<T>>,
) {
	if (import.meta.dev) {
		router.map(route, async (context) => {
			const handler = await load();
			if (
				typeof handler === "object" &&
				handler != null &&
				"use" in handler &&
				"handler" in handler
			) {
				return runHandlerWithMiddleware(
					handler as HandlerWithMiddleware,
					context as AnyRequestContext,
				);
			}

			return (handler as PlainHandler)(context as AnyRequestContext);
		});
	} else {
		const handler = await load();
		router.map(route, handler);
	}
}
