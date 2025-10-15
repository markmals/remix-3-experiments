import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { remixRefresh } from "./remix-refresh.plugin.ts";

export default defineConfig({
	plugins: [nitro(), remixRefresh()],
	server: {
		port: 1612,
	},
	experimental: {
		enableNativePlugin: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
	css: {
		transformer: "lightningcss",
	},
});
