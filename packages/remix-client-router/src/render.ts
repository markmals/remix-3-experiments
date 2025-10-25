import type { Remix } from "@remix-run/dom";

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
    const response = new Response(null, init);
    response._element = element;
    return response;
}
