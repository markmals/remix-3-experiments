import type { Remix } from "@remix-run/dom";
import { dom, events } from "@remix-run/events";
import { Router } from "remix-client-router";
import { App } from "~/app.tsx";
import { ValueObserver } from "~/lib/value-observer.ts";

export function SearchBar(this: Remix.Handle, props: { query?: string }) {
	const observer = new ValueObserver(props.query);
	events(observer, [
		observer.change(
			(event) => {
				props.query = event.detail;
				document.querySelector<HTMLInputElement>("#q")!.value =
					event.detail ?? "";
			},
			{ signal: this.signal },
		),
	]);

	const router = this.context.get(App);
	events(router, [Router.update(() => this.update(), { signal: this.signal })]);

	const searching = () =>
		Boolean(router.navigating.to.url?.searchParams.has("q"));

	const handleInput = dom.input<HTMLInputElement>((event) => {
		// Remove empty query params when value is empty
		if (!event.currentTarget.value) {
			router.navigate(router.location.pathname + router.location.hash);
			return;
		}

		const isFirstSearch = props.query === undefined;
		// Simulate <form method="get"> programatically
		// Adds <input name value>s as search params to URL
		// Also performs a client-side navigation
		router.submit(event.currentTarget.form, {
			replace: !isFirstSearch,
		});
	});

	return ({ query }: { query?: string }) => {
		observer.next(query);
		return (
			<form id="search-form" method="get">
				<input
					aria-label="Search contacts"
					className={searching() ? "loading" : ""}
					defaultValue={query}
					id="q"
					name="q"
					on={handleInput}
					placeholder="Search"
					type="search"
				/>
				<div aria-hidden hidden={!searching()} id="search-spinner" />
				<div aria-live="polite" className="sr-only" />
			</form>
		);
	};
}
