import type { Remix } from "@remix-run/dom";
import { renderToStream } from "@remix-run/dom/server";
import { html } from "@remix-run/fetch-router";

declare global {
    interface Response {
        _element: Remix.RemixElement;
    }
}

export function render(element: Remix.RemixElement, init?: ResponseInit) {
    const response = html(renderToStream(element), init);
    response._element = element;
    return response;
}
