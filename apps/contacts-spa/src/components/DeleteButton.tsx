import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { routes } from "~/routes/mod";

export function DeleteButton(this: Remix.Handle) {
	const submit = dom.submit((event) => {
		if (!confirm("Please confirm you want to delete this record.")) {
			event.preventDefault();
		}
	});

	return ({ id }: { id: string }) => (
		<form
			data-destroy
			action={routes.contact.destroy.href({ contactId: id })}
			method="post"
			on={submit}
		>
			<input type="hidden" name="_method" value="DELETE" />
			<button type="submit">Delete</button>
		</form>
	);
}
