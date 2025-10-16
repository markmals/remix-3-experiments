import type { Remix } from "@remix-run/dom";
import { renderToStream } from "@remix-run/dom/server";
import { html } from "@remix-run/fetch-router";

import { router } from "~/router.ts";

export async function resolveFrame(src: string) {
	const url = new URL(src, "http://localhost:44100");
	const response = await router.fetch(url);
	return <>{await response.text()}</>;
}

export function render(element: Remix.RemixElement, init?: ResponseInit) {
	return html(renderToStream(element, { resolveFrame }), init);
}
