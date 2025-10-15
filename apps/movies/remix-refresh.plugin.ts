import type { Plugin } from "vite";

type Matcher = RegExp | ((file: string) => boolean);

const DEFAULT_MATCHERS: Matcher[] = [
	/\/app\/pages\//,
	/\/app\/components\//,
	/\/app\/document\.tsx?$/,
	/\/app\/routes\.tsx?$/,
	/\/app\/styles\//,
];

function shouldRefresh(file: string, matchers: Matcher[]): boolean {
	return matchers.some((matcher) =>
		typeof matcher === "function" ? matcher(file) : matcher.test(file),
	);
}

export function remixRefresh(matchers: Matcher[] = DEFAULT_MATCHERS): Plugin {
	return {
		name: "remix-refresh",
		apply: "serve",
		handleHotUpdate(ctx) {
			if (shouldRefresh(ctx.file, matchers)) {
				ctx.server.ws.send({ type: "full-reload" });
				return [];
			}

			return undefined;
		},
	};
}
