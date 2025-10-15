import { createRouter } from "@remix-run/fetch-router";
import { logger } from "@remix-run/fetch-router/logger-middleware";

import { routes } from "./routes.ts";
import { lazyMap } from "./utils/map-route.ts";

export const router = createRouter();

if (import.meta.dev) {
	router.use(logger());
}

lazyMap(router, routes.index, () => import("./pages/home.tsx"));
