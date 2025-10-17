import type { Remix } from "@remix-run/dom";
import { renderToString } from "@remix-run/dom/server";
import { html } from "@remix-run/fetch-router";

declare global {
	interface Response {
		_element: Remix.RemixElement;
	}
}

export async function render(element: Remix.RemixElement, init?: ResponseInit) {
	const doc = await renderToString(element);
	const response = html(doc, init);
	response._element = element;
	return response;
}
