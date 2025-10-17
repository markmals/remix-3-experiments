import type { EventHandler } from "@remix-run/events";
import { createInteraction, dom, events } from "@remix-run/events";

export function optimistic({
	action,
	update: handler,
	signal,
}: {
	signal: AbortSignal;
	action: (formData: FormData) => Promise<void>;
	update: EventHandler<CustomEvent<FormData | null>, HTMLFormElement>;
}) {
	const optimisticUpdates = createInteraction<HTMLFormElement, FormData | null>(
		"rmx:optimistic",
		({ target, dispatch }) => {
			return events(target, [
				dom.submit(async (event) => {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();

					const formData = new FormData(event.currentTarget, event.submitter);
					dispatch({ detail: formData });

					await action(formData);
					if (signal.aborted) return;

					dispatch({ detail: null });
				}),
			]);
		},
	);

	return optimisticUpdates(handler);
}
