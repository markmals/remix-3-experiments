/** biome-ignore-all lint/suspicious/noExplicitAny: needed for type coercion */
import type { Remix } from "@remix-run/dom";
import { createEventType, doc, events, win } from "@remix-run/events";
import { AppStorage, type RouteMap } from "@remix-run/fetch-router";
import type {
	ClientRouteHandlers,
	FormEncType,
	FormMethod,
	GetClientRouteContext,
	JsonValue,
	MutationClientRouteContext,
	NavigateOptions,
	Navigating,
	Navigation,
	Path,
	SubmitOptions,
	SubmitTarget,
	To,
	UpperCaseFormMethod,
} from "./types.ts";

const [update, createUpdate] = createEventType("rmx-router:update");

// Cache the origin since it can't change
const origin =
	window.location.origin ||
	`${window.location.protocol}//${window.location.host}`;

export class Router<Routes extends RouteMap> extends EventTarget {
	static update = update;

	#location: Location;
	#navigating: Navigating;
	#outlet: Remix.RemixNode = null;
	#routes: Routes;
	#handlers: ClientRouteHandlers<Routes>;
	#storage: AppStorage;

	get location(): Location {
		return this.#location;
	}

	get navigating(): Navigating {
		return this.#navigating;
	}

	get outlet(): Remix.RemixNode {
		return this.#outlet;
	}

	constructor(routes: Routes, handlers: ClientRouteHandlers<Routes>) {
		super();

		this.#routes = routes;
		this.#handlers = handlers;
		this.#location = window.location;
		this.#storage = new AppStorage();
		this.#navigating = {
			to: {
				state: "idle",
				location: undefined,
				url: undefined,
				formMethod: undefined,
				formAction: undefined,
				formEncType: undefined,
				formData: undefined,
				json: undefined,
				text: undefined,
			},
			from: {
				state: "idle",
				location: undefined,
				url: undefined,
				formMethod: undefined,
				formAction: undefined,
				formEncType: undefined,
				formData: undefined,
				json: undefined,
				text: undefined,
			},
		};

		// Handle routing events
		events(document, [this.#handleClick, this.#handleSubmit]);
		events(window, [
			win.popstate(() => {
				this.#gotoSelf();
			}),
		]);

		// Initial navigation to current URL
		this.#gotoSelf();
	}

	// Call whenever the internal state changes
	#update(): void {
		this.dispatchEvent(createUpdate());
	}

	#handleClick = doc.click((event) => {
		const isNonNavigationClick =
			event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey;
		if (event.defaultPrevented || isNonNavigationClick) {
			return;
		}

		const anchor = event
			.composedPath()
			.find((n) => (n as HTMLElement).tagName === "A") as
			| HTMLAnchorElement
			| undefined;

		if (
			anchor === undefined ||
			anchor.target !== "" ||
			anchor.hasAttribute("download") ||
			anchor.getAttribute("rel") === "external"
		) {
			return;
		}

		const href = anchor.href;
		if (href === "" || href.startsWith("mailto:")) {
			return;
		}

		if (anchor.origin !== origin) {
			return;
		}

		event.preventDefault();
		const targetPath = anchor.pathname + anchor.search + anchor.hash;
		if (href !== window.location.href) {
			void this.navigate(targetPath, {});
		}
	});

	#handleSubmit = doc.submit((event) => {
		const form = event.target as HTMLFormElement;

		// Check if form has target or external action
		if (form.target && form.target !== "_self") {
			return;
		}

		const action = form.action;
		if (action && new URL(action).origin !== origin) {
			return;
		}

		event.preventDefault();
		this.submit(form, {});
	});

	async #goto(
		pathname: string,
		submission?: {
			formMethod: FormMethod;
			formAction: string;
			formEncType: FormEncType;
			formData?: FormData;
			json?: JsonValue;
			text?: string;
		},
	): Promise<void> {
		// Parse the pathname
		const url = new URL(pathname, window.location.origin);
		const location = {
			...window.location,
			pathname: url.pathname,
			search: url.search,
			hash: url.hash,
			href: url.href,
		} as Location;

		// Set up navigation state
		const fromNavigation = this.#navigating.to;
		const toNavigation: Navigation = submission
			? {
					state: "submitting",
					location,
					url,
					formMethod: submission.formMethod,
					formAction: submission.formAction,
					formEncType: submission.formEncType,
					formData: submission.formData,
					json: submission.json,
					text: submission.text,
				}
			: {
					state: "loading",
					location,
					url,
					formMethod: undefined,
					formAction: undefined,
					formEncType: undefined,
					formData: undefined,
					json: undefined,
					text: undefined,
				};

		this.#navigating = {
			to: toNavigation,
			from: fromNavigation,
		};
		this.#update();

		try {
			// Match the route and get params
			const method = submission?.formMethod || "GET";
			const matchResult = this.#matchRoute(url, method);

			if (!matchResult) {
				throw new Error(`No route found for ${pathname} with method ${method}`);
			}

			// Call the route handler
			const result = await this.#callHandler(
				matchResult.params,
				matchResult.routePath,
				url,
				submission,
			);

			// Update outlet with the result
			this.#outlet = result;
			this.#location = location;

			// Set navigating to idle
			this.#navigating = {
				to: {
					state: "idle",
					location: undefined,
					url: undefined,
					formMethod: undefined,
					formAction: undefined,
					formEncType: undefined,
					formData: undefined,
					json: undefined,
					text: undefined,
				},
				from: toNavigation,
			};
			this.#update();
		} catch (error) {
			// Handle error - for now just set to idle
			console.error("Navigation error:", error);
			this.#navigating = {
				to: {
					state: "idle",
					location: undefined,
					url: undefined,
					formMethod: undefined,
					formAction: undefined,
					formEncType: undefined,
					formData: undefined,
					json: undefined,
					text: undefined,
				},
				from: toNavigation,
			};
			this.#update();
			throw error;
		}
	}

	async #gotoSelf() {
		await this.#goto(
			window.location.pathname + window.location.search + window.location.hash,
		);
	}

	#matchRoute(
		url: URL,
		method: string = "GET",
	): { params: Record<string, string>; routePath: string[] } | null {
		// Traverse the route map to find a matching route
		const pathname = url.pathname;

		// Try to match against all routes in the map, considering the HTTP method
		const result = this.#matchRouteInMap(this.#routes, pathname, method, []);
		return result;
	}

	#matchRouteInMap(
		routeMap: any,
		pathname: string,
		method: string,
		path: string[],
	): { params: Record<string, string>; routePath: string[] } | null {
		// Sort routes to prioritize static routes over parameterized ones
		// This ensures /blog/new is checked before /blog/:postId
		const entries = Object.entries(routeMap);

		// Debug: log routes before sorting
		if (pathname === "/blog/new") {
			console.log("Matching pathname:", pathname, "method:", method);
			console.log(
				"Routes before sorting:",
				entries.map(([key, route]) => ({
					key,
					pattern: (route as any)?.pattern,
					method: (route as any)?.method,
					hasMatch: typeof (route as any)?.match === "function",
				})),
			);
		}

		entries.sort(([_keyA, routeA], [_keyB, routeB]) => {
			// If both are Route objects with patterns, compare specificity
			const aHasPattern =
				routeA &&
				typeof routeA === "object" &&
				"pattern" in routeA &&
				typeof routeA.pattern === "string";
			const bHasPattern =
				routeB &&
				typeof routeB === "object" &&
				"pattern" in routeB &&
				typeof routeB.pattern === "string";

			if (aHasPattern && bHasPattern) {
				const aPattern = (routeA as { pattern: string }).pattern;
				const bPattern = (routeB as { pattern: string }).pattern;
				const aIsStatic = !aPattern.includes(":");
				const bIsStatic = !bPattern.includes(":");

				// Static routes come before dynamic routes
				if (aIsStatic && !bIsStatic) return -1;
				if (!aIsStatic && bIsStatic) return 1;

				// For routes of same type, longer (more specific) patterns come first
				return bPattern.length - aPattern.length;
			}

			// Keep original order for non-route objects
			return 0;
		});

		// Debug: log routes after sorting
		if (pathname === "/blog/new") {
			console.log(
				"Routes after sorting:",
				entries.map(([key, route]) => ({
					key,
					pattern: (route as any)?.pattern,
					method: (route as any)?.method,
					hasMatch: typeof (route as any)?.match === "function",
				})),
			);
		}

		for (const [key, route] of entries) {
			// Check if this is a Route object (has a match method)
			if (
				route &&
				typeof route === "object" &&
				"match" in route &&
				typeof route.match === "function"
			) {
				// Check if the route's method matches (if specified)
				// Routes without explicit method default to "ANY" and match all methods
				const routeMethod = (route as any).method || "ANY";
				const methodMatches = routeMethod === "ANY" || routeMethod === method;

				if (methodMatches) {
					const matchResult = route.match({ pathname });
					if (matchResult) {
						console.log(
							`Matched route: ${[...path, key].join(".")} (method: ${routeMethod}, pathname: ${pathname})`,
						);
						return {
							params: matchResult.params,
							routePath: [...path, key],
						};
					}
				}
			}

			// If it's a nested RouteMap, recurse
			if (route && typeof route === "object" && !("match" in route)) {
				const nestedResult = this.#matchRouteInMap(route, pathname, method, [
					...path,
					key,
				]);
				if (nestedResult) {
					return nestedResult;
				}
			}
		}

		return null;
	}

	async #callHandler(
		params: Record<string, string>,
		routePath: string[],
		url: URL,
		submission?: {
			formMethod: FormMethod;
			formAction: string;
			formEncType: FormEncType;
			formData?: FormData;
			json?: JsonValue;
			text?: string;
		},
	): Promise<Remix.RemixNode> {
		// Traverse the handler tree using the routePath
		// For example, routePath = ["blog", "post"] means handlers.blog.post
		const handler = this.#findHandlerByPath(this.#handlers, routePath);

		if (!handler) {
			throw new Error(
				`No handler found for route path: ${routePath.join(".")}`,
			);
		}

		const method = (submission?.formMethod || "GET") as UpperCaseFormMethod;

		// Build context based on method type
		if (method === "GET") {
			return await handler({
				params,
				method: "GET",
				url,
				storage: this.#storage,
			});
		}

		// For mutation methods, formData is required
		if (!submission?.formData) {
			throw new Error(`FormData is required for ${method} requests`);
		}

		return await handler({
			params,
			method,
			formData: submission.formData,
			url,
			storage: this.#storage,
		});
	}

	#findHandlerByPath(
		handlers: any,
		routePath: string[],
	):
		| ((
				context: GetClientRouteContext | MutationClientRouteContext,
		  ) => Remix.RemixNode | Promise<Remix.RemixNode>)
		| null {
		// Traverse the handler tree following the route path
		// routePath = ["blog", "post"] -> handlers.blog.post
		// routePath = ["blog", "index"] -> handlers.blog.index
		// routePath = ["index"] -> handlers.index

		let current: any = handlers;

		for (const segment of routePath) {
			if (current?.[segment]) {
				current = current[segment];
			} else {
				return null;
			}
		}

		// The current value should be a function (the handler)
		if (typeof current === "function") {
			return current;
		}

		return null;
	}

	async navigate(to: To, options: NavigateOptions = {}): Promise<void> {
		const pathname = this.#resolveTo(to);

		// Update history
		if (options.replace) {
			window.history.replaceState({}, "", pathname);
		} else {
			window.history.pushState({}, "", pathname);
		}

		// Perform navigation
		await this.#goto(pathname);
	}

	async submit(
		target: SubmitTarget,
		options: SubmitOptions = {},
	): Promise<void> {
		let formData: FormData | undefined;
		let json: JsonValue | undefined;
		let text: string | undefined;
		let formAction: string;
		let formMethod: FormMethod;
		let formEncType: FormEncType;

		// Determine what we're submitting
		if (target instanceof HTMLFormElement) {
			formData = new FormData(target);
			formAction = options.action || target.action || window.location.pathname;
			formMethod = (
				options.method ||
				target.method ||
				"GET"
			).toUpperCase() as FormMethod;
			formEncType = (options.encType ||
				target.enctype ||
				"application/x-www-form-urlencoded") as FormEncType;
		} else if (target instanceof FormData) {
			formData = target;
			formAction = options.action || window.location.pathname;
			formMethod = (options.method || "POST").toUpperCase() as FormMethod;
			formEncType = (options.encType ||
				"application/x-www-form-urlencoded") as FormEncType;
		} else if (target instanceof URLSearchParams) {
			formData = new FormData();
			for (const [key, value] of target.entries()) {
				formData.append(key, value);
			}
			formAction = options.action || window.location.pathname;
			formMethod = (options.method || "POST").toUpperCase() as FormMethod;
			formEncType = (options.encType ||
				"application/x-www-form-urlencoded") as FormEncType;
		} else if (
			typeof target === "string" ||
			typeof target === "number" ||
			typeof target === "boolean" ||
			target === null ||
			typeof target === "object"
		) {
			json = target as JsonValue;
			formAction = options.action || window.location.pathname;
			formMethod = (options.method || "POST").toUpperCase() as FormMethod;
			formEncType = "application/json";
		} else {
			throw new Error("Invalid submit target");
		}

		// Update history if this is a navigation
		if (options.navigate !== false) {
			if (options.replace) {
				window.history.replaceState({}, "", formAction);
			} else {
				window.history.pushState({}, "", formAction);
			}
		}

		// Perform submission
		await this.#goto(formAction, {
			formMethod,
			formAction,
			formEncType,
			formData,
			json,
			text,
		});
	}

	/**
	 * Check if a path is currently active.
	 * Supports partial matching - e.g., isActive("/blog") returns true for "/blog/post/1"
	 * @param path - The path to check
	 * @param exact - If true, requires exact match. Default is false (partial match)
	 */
	isActive(path: string | URL | Path, exact = false): boolean {
		const pathname = this.#pathToString(path);
		const currentPath = this.#location.pathname;

		if (exact) {
			return currentPath === pathname;
		}

		// Partial match: current path starts with the given path
		// Ensure we match on segment boundaries
		if (pathname === "/") {
			return currentPath === "/";
		}
		return currentPath === pathname || currentPath.startsWith(`${pathname}/`);
	}

	/**
	 * Check if a path is currently pending navigation.
	 * Supports partial matching - e.g., isPending("/blog") returns true when navigating to "/blog/post/1"
	 * @param path - The path to check
	 * @param exact - If true, requires exact match. Default is false (partial match)
	 */
	isPending(path: string | URL | Path, exact = false): boolean {
		if (this.#navigating.to.state === "idle") {
			return false;
		}
		const pathname = this.#pathToString(path);
		const pendingPath = this.#navigating.to.location?.pathname;

		if (!pendingPath) {
			return false;
		}

		if (exact) {
			return pendingPath === pathname;
		}

		// Partial match: pending path starts with the given path
		if (pathname === "/") {
			return pendingPath === "/";
		}
		return pendingPath === pathname || pendingPath.startsWith(`${pathname}/`);
	}

	#resolveTo(to: To): string {
		if (typeof to === "number") {
			// Relative navigation
			return window.location.pathname;
		}
		if (typeof to === "string") {
			return to;
		}
		if (to instanceof URL) {
			return to.pathname + to.search + to.hash;
		}
		// Partial<Path>
		const pathname = to.pathname || window.location.pathname;
		const search = to.search || "";
		const hash = to.hash || "";
		return pathname + search + hash;
	}

	#pathToString(path: string | URL | Path): string {
		if (typeof path === "string") {
			return path;
		}
		if (path instanceof URL) {
			return path.pathname;
		}
		return path.pathname;
	}
}
