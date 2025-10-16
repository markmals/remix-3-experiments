import type { Remix } from "@remix-run/dom";
import type { AppStorage, Route, RouteMap } from "@remix-run/fetch-router";
import type { Params } from "@remix-run/route-pattern";

export type LowerCaseFormMethod = "get" | "post" | "put" | "patch" | "delete";
export type UpperCaseFormMethod = Uppercase<LowerCaseFormMethod>;
/**
 * Users can specify either lowercase or uppercase form methods on `<Form>`,
 * useSubmit(), `<fetcher.Form>`, etc.
 */
export type HTMLFormMethod = LowerCaseFormMethod | UpperCaseFormMethod;
/**
 * Active navigation/fetcher form methods are exposed in uppercase on the
 * RouterState. This is to align with the normalization done via fetch().
 */
export type FormMethod = UpperCaseFormMethod;
export type FormEncType =
	| "application/x-www-form-urlencoded"
	| "multipart/form-data"
	| "application/json"
	| "text/plain";
export type JsonObject = {
	[Key in string]: JsonValue;
} & {
	[Key in string]?: JsonValue | undefined;
};
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type Submission =
	| {
			formMethod: FormMethod;
			formAction: string;
			formEncType: FormEncType;
			formData: FormData;
			json: undefined;
			text: undefined;
	  }
	| {
			formMethod: FormMethod;
			formAction: string;
			formEncType: FormEncType;
			formData: undefined;
			json: JsonValue;
			text: undefined;
	  }
	| {
			formMethod: FormMethod;
			formAction: string;
			formEncType: FormEncType;
			formData: undefined;
			json: undefined;
			text: string;
	  };

export type NavigationStates = {
	Idle: {
		state: "idle";
		location: undefined;
		url: undefined;
		formMethod: undefined;
		formAction: undefined;
		formEncType: undefined;
		formData: undefined;
		json: undefined;
		text: undefined;
	};
	Loading: {
		state: "loading";
		location: Location;
		url: URL;
		formMethod: Submission["formMethod"] | undefined;
		formAction: Submission["formAction"] | undefined;
		formEncType: Submission["formEncType"] | undefined;
		formData: Submission["formData"] | undefined;
		json: Submission["json"] | undefined;
		text: Submission["text"] | undefined;
	};
	Submitting: {
		state: "submitting";
		location: Location;
		url: URL;
		formMethod: Submission["formMethod"];
		formAction: Submission["formAction"];
		formEncType: Submission["formEncType"];
		formData: Submission["formData"];
		json: Submission["json"];
		text: Submission["text"];
	};
};
export type Navigation = NavigationStates[keyof NavigationStates];

export type RelativeRoutingType = "route" | "path";
export interface NavigateOptions {
	/** Replace the current entry in the history stack instead of pushing a new one */
	replace?: boolean;
	/** Prevent the scroll position from being reset to the top of the window when navigating */
	preventScrollReset?: boolean;
	/** Defines the relative path behavior for the link. "route" will use the route hierarchy so ".." will remove all URL segments of the current route pattern while "path" will use the URL path so ".." will remove one URL segment. */
	relative?: RelativeRoutingType;
	/** Wraps the initial state update for this navigation in a {@link https://react.dev/reference/react-dom/flushSync ReactDOM.flushSync} call instead of the default {@link https://react.dev/reference/react/startTransition React.startTransition} */
	flushSync?: boolean;
	/** Enables a {@link https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API View Transition} for this navigation by wrapping the final state update in `document.startViewTransition()`. If you need to apply specific styles for this view transition, you will also need to leverage the {@link https://api.reactrouter.com/v7/functions/react_router.useViewTransitionState.html useViewTransitionState()} hook.  */
	viewTransition?: boolean;
}

export interface Path {
	/**
	 * A URL pathname, beginning with a /.
	 */
	pathname: string;
	/**
	 * A URL search string, beginning with a ?.
	 */
	search: string;
	/**
	 * A URL fragment identifier, beginning with a #.
	 */
	hash: string;
}
export type To = number | string | URL | Partial<Path>;

export type SubmitTarget =
	| HTMLFormElement
	| HTMLButtonElement
	| HTMLInputElement
	| FormData
	| URLSearchParams
	| JsonValue
	| null;
export interface SubmitOptions {
	/**
	 * The HTTP method used to submit the form. Overrides `<form method>`.
	 * Defaults to "GET".
	 */
	method?: HTMLFormMethod;
	/**
	 * The action URL path used to submit the form. Overrides `<form action>`.
	 * Defaults to the path of the current route.
	 */
	action?: string;
	/**
	 * The encoding used to submit the form. Overrides `<form encType>`.
	 * Defaults to "application/x-www-form-urlencoded".
	 */
	encType?: FormEncType;
	/**
	 * Determines whether the form action is relative to the route hierarchy or
	 * the pathname.  Use this if you want to opt out of navigating the route
	 * hierarchy and want to instead route based on /-delimited URL segments
	 */
	relative?: RelativeRoutingType;
	/**
	 * In browser-based environments, prevent resetting scroll after this
	 * navigation when using the <ScrollRestoration> component
	 */
	preventScrollReset?: boolean;
	/**
	 * Enable flushSync for this submission's state updates
	 */
	flushSync?: boolean;
	/**
	 * Set `true` to replace the current entry in the browser's history stack
	 * instead of creating a new one (i.e. stay on "the same page"). Defaults
	 * to `false`.
	 */
	replace?: boolean;
	/**
	 * navigate=false will use a fetcher instead of a navigation
	 */
	navigate?: boolean;
	/**
	 * Enable view transitions on this submission navigation
	 */
	viewTransition?: boolean;
}

export type Navigating = {
	to: Navigation;
	from: Navigation;
};

/**
 * Base context available to all route handlers
 */
export interface BaseClientRouteContext<P extends Record<string, string> = Record<string, string>> {
	params: P;
	url: URL;
	storage: AppStorage;
}

/**
 * Context for GET routes - no formData
 */
export interface GetClientRouteContext<P extends Record<string, string> = Record<string, string>>
	extends BaseClientRouteContext<P> {
	method: "GET";
	formData?: never;
}

/**
 * Context for mutation routes (POST, PUT, PATCH, DELETE) - includes formData
 */
export interface MutationClientRouteContext<P extends Record<string, string> = Record<string, string>>
	extends BaseClientRouteContext<P> {
	method: Exclude<UpperCaseFormMethod, "GET">;
	formData: FormData;
}

/**
 * Context object passed to client-side route handlers
 */
export type ClientRouteContext<P extends Record<string, string> = Record<string, string>> =
	| GetClientRouteContext<P>
	| MutationClientRouteContext<P>;

/**
 * A client-side route handler function that returns JSX.
 * The context type is inferred from the route's method and params.
 */
export type ClientRouteHandler<M extends string = string, P extends string = string> =
	M extends "GET" | "ANY"
		? (context: GetClientRouteContext<Params<P>>) => Remix.RemixNode | Promise<Remix.RemixNode>
		: (context: MutationClientRouteContext<Params<P>>) =>
				| Remix.RemixNode
				| Promise<Remix.RemixNode>;

/**
 * Type for client-side route handlers that matches the structure of RouteHandlers
 * but returns JSX instead of Response objects.
 */
export type ClientRouteHandlers<T extends RouteMap> = {
	[K in keyof T]: T[K] extends Route<infer M, infer P>
		? ClientRouteHandler<M, P>
		: T[K] extends RouteMap
			? ClientRouteHandlers<T[K]>
			: never;
};
