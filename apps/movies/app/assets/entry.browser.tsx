import { createFrame } from "@remix-run/dom";

const frame = createFrame(document, {
	async loadModule(moduleUrl, name) {
		const mod = await import(/* @vite-ignore */ moduleUrl);
		if (!mod) {
			throw new Error(`Unknown module: ${moduleUrl}#${name}`);
		}

		const Component = mod[name];
		if (!Component) {
			throw new Error(`Unknown component: ${moduleUrl}#${name}`);
		}

		return Component;
	},

	async resolveFrame(frameUrl) {
		const res = await fetch(frameUrl);
		if (res.ok) {
			return res.text();
		}

		throw new Error(`Failed to fetch ${frameUrl}`);
	},
});

await frame.ready();

console.log("[entry.browser] root frame ready.");
