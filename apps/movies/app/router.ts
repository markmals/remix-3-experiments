import { createRouter } from "@remix-run/fetch-router";
import { logger } from "@remix-run/fetch-router/logger-middleware";

import { routes } from "./routes.ts";
import { lazyMap } from "./utils/map-route.ts";

export const router = createRouter();

if (import.meta.dev) {
	router.use(logger());
}

lazyMap(router, routes.index, () =>
	import("./pages/movies.tsx").then((m) => m.index),
);
lazyMap(router, routes.movies.show, () =>
	import("./pages/movies.tsx").then((m) => m.show),
);
lazyMap(router, routes.tv.index, () =>
	import("./pages/tv.tsx").then((m) => m.index),
);
lazyMap(router, routes.tv.show, () =>
	import("./pages/tv.tsx").then((m) => m.show),
);
lazyMap(router, routes.people.index, () =>
	import("./pages/people.tsx").then((m) => m.index),
);
lazyMap(router, routes.people.show, () =>
	import("./pages/people.tsx").then((m) => m.show),
);
