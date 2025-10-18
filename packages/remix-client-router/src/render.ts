import type { Remix } from "@remix-run/dom";
import { renderToStream } from "@remix-run/dom/server";
import { html } from "@remix-run/fetch-router";

declare global {
    interface Response {
        _element: Remix.RemixElement;
    }
}

/**
 * Render a Remix element to a {@link Response} and attach the original element for client reuse.
 *
 * @param element - Remix element tree to render on the server.
 * @param init - Optional response initialization options.
 * @returns Response containing the rendered stream and the captured element.
 */
export function render(element: Remix.RemixElement, init?: ResponseInit) {
    const response = html(renderToStream(element), init);
    response._element = element;
    return response;
}
