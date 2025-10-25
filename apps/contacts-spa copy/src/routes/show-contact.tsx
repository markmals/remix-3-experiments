import type { InferRouteHandler } from "@remix-run/fetch-router";
import { render } from "remix-client-router";
import { DeleteButton } from "~/components/DeleteButton.tsx";
import { Favorite } from "~/components/Favorite.tsx";
import { CONTACTS_KEY, getContacts } from "~/lib/contacts.ts";
import { routes } from "~/routes/mod";

export const show: InferRouteHandler<typeof routes.contact.show> = async ({
	params,
	storage,
	url,
}) => {
	const query = url.searchParams.get("q");
	const contacts = await getContacts(query);
	storage.set(CONTACTS_KEY, contacts);

	const contact = contacts.find((c) => c.id === params.contactId)!;
	const hasAvatar = !!contact.avatar;

	return render(
		<div id="contact">
			<div>
				<img
					alt=""
					key={contact.id}
					src={
						hasAvatar
							? contact.avatar
							: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
					}
				/>
			</div>

			<div>
				<h1>
					{contact.first || contact.last ? (
						<>
							{contact.first} {contact.last}
						</>
					) : (
						<i>No Name</i>
					)}{" "}
					<Favorite id={contact.id} favorite={contact.favorite!} />
				</h1>

				{contact.twitter && (
					<p>
						<a
							href={`https://xcancel.com/${contact.twitter.slice(1, contact.twitter.length)}`}
							rel="noreferrer"
							target="_blank"
						>
							{contact.twitter}
						</a>
					</p>
				)}

				{contact.notes && <p>{contact.notes}</p>}

				<div>
					<form
						action={routes.contact.edit.href({
							contactId: contact.id,
						})}
					>
						<button type="submit">Edit</button>
					</form>
					<DeleteButton id={contact.id} />
				</div>
			</div>
		</div>,
	);
};
