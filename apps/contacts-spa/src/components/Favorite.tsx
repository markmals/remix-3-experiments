import type { Remix } from "@remix-run/dom";
import { App } from "~/app.tsx";
import { optimistic } from "~/lib/omtimistic.ts";
import { routes } from "~/routes/mod";

export function Favorite(
	this: Remix.Handle,
	props: { favorite: boolean; id: string },
) {
	const router = this.context.get(App);
	let optimisticFavorite: boolean | null = null;
	let currentContactId = props.id;

	return (props: { favorite: boolean; id: string }) => {
		// Reset optimistic state if contact changed
		if (currentContactId !== props.id) {
			optimisticFavorite = null;
			currentContactId = props.id;
		}

		const favorite =
			optimisticFavorite !== null ? optimisticFavorite : props.favorite;

		const formAction = routes.contact.favorite.href({ contactId: props.id });

		return (
			<form
				method="post"
				action={formAction}
				on={optimistic({
					action: async (formData: FormData) =>
						await router.submit(formData, {
							action: routes.contact.favorite.href({
								contactId: currentContactId,
							}),
							method: "PUT",
						}),
					update: ({ detail: formData }) => {
						optimisticFavorite = formData
							? formData?.get("favorite") === "true"
							: null;

						this.update();
					},
					signal: this.signal,
				})}
			>
				<input type="hidden" name="_method" value="PUT" />
				<button
					aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
					name="favorite"
					type="submit"
					value={favorite ? "false" : "true"}
				>
					{favorite ? "★" : "☆"}
				</button>
			</form>
		);
	};
}
