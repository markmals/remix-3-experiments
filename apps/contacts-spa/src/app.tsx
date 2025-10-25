import type { Remix } from "@remix-run/dom";
import { Router } from "remix-client-router";
import { Details } from "./components/Details.tsx";
import { SearchBar } from "./components/SearchBar.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { CONTACTS_KEY, getContacts } from "./lib/contacts.ts";
import { create, destroy, favorite, update } from "./routes/actions.ts";
import { edit } from "./routes/edit-contaxt.tsx";
import { index } from "./routes/index.tsx";
import { routes } from "./routes/mod.ts";
import { show } from "./routes/show-contact.tsx";

const router = new Router();

// Pages
router.map(routes.index, index);
router.map(routes.contact.show, show);
router.map(routes.contact.edit, edit);

// Actions
router.map(routes.contact.update, update);
router.map(routes.contact.create, create);
router.map(routes.contact.destroy, destroy);
router.map(routes.contact.favorite, favorite);

// Load initial data into storage
const contacts = await getContacts();
router.storage.set(CONTACTS_KEY, contacts);

export function App(this: Remix.Handle<Router>) {
	this.context.set(router);

	return () => (
		<>
			<div id="sidebar">
				<h1>Remix Contacts</h1>
				<div>
					<SearchBar />
					<form method="post" action={routes.contact.create.href()}>
						<button type="submit">New</button>
					</form>
				</div>
				<Sidebar />
			</div>
			<Details />
		</>
	);
}
