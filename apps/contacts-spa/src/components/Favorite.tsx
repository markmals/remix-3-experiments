import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { App } from "~/app.tsx";
import { routes } from "~/routes/mod";

export type FavoriteProps = { favorite: boolean; id: string };

export function Favorite(this: Remix.Handle) {
	const router = this.context.get(App);
	let optimisticFavorite: boolean | null = null;

	return (props: FavoriteProps) => {
		const favorite =
			optimisticFavorite !== null ? optimisticFavorite : props.favorite;

		return (
			<form
				method="post"
				action={routes.contact.favorite.href({ contactId: props.id })}
				on={dom.submit(async (event) => {
					event.preventDefault();
					event.stopPropagation();

					const formData = new FormData(event.currentTarget, event.submitter);
					optimisticFavorite = formData.get("favorite") === "true";
					this.update();

					// Submit to the favorite handler without navigating
					await router.submit(formData, {
						action: routes.contact.favorite.href({ contactId: props.id }),
						method: "PUT",
						navigate: false,
					});
					if (this.signal.aborted) return;

					optimisticFavorite = null;
					this.update();
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
