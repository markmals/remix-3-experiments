import { html, type InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import { CreditsList } from "~/components/people/CreditsList.tsx";
import { PersonProfile } from "~/components/people/PersonProfile.tsx";
import { PeopleShowcase } from "~/components/sections/PeopleShowcase.tsx";
import { Document } from "~/document.tsx";
import { loadPersonDetailsPage } from "~/lib/people/loaders.ts";
import { type TMDb, tmdb } from "~/lib/services/tmdb/client.ts";
import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";
import { render } from "~/utils/render.tsx";

type PopularPerson = NonNullable<
	NonNullable<Awaited<ReturnType<TMDb["getPopularPeople"]>>>["results"]
>[number];

function mapPersonToCard(person: PopularPerson) {
	if (!person?.id) return null;

	return {
		id: person.id,
		name: person.name ?? "Unknown",
		profile_path: person.profile_path ?? undefined,
		known_for_department: person.known_for_department ?? undefined,
		popularity: typeof person.popularity === "number" ? person.popularity : 0,
		href: routes.people.show.href({ id: person.id.toString() }),
	};
}

export const index: InferRouteHandler<typeof routes.people.index> = async ({
	url,
}) => {
	const popularPeopleData = await tmdb.getPopularPeople();
	const popularPeople = Array.isArray(popularPeopleData?.results)
		? popularPeopleData.results
		: [];

	const cards = popularPeople
		.map(mapPersonToCard)
		.filter((value): value is NonNullable<typeof value> => value !== null);

	return render(
		<Document title="Remix People">
			<Layout currentUrl={url}>
				<PeopleShowcase
					label={new Date().toDateString()}
					people={cards}
					title="Popular People"
				/>
			</Layout>
		</Document>,
	);
};

export const show: InferRouteHandler<typeof routes.people.show> = async ({
	params,
	url,
}) => {
	const person = await loadPersonDetailsPage(params.id);

	if (!person) {
		return html("Person not found", { status: 404 });
	}

	return render(
		<Document title={person.pageTitle}>
			<Layout currentUrl={url}>
				<article
					css={{
						position: "relative",
						width: "100%",
					}}
				>
					<div
						css={{
							maxWidth: "min(1160px, 94vw)",
							margin: "0 auto",
							padding: `${$("spacing-16")} ${$("spacing-4")}`,
						}}
					>
						<PersonProfile
							biography={person.biography}
							department={person.department}
							externalLinks={person.externalLinks}
							keyFacts={person.keyFacts}
							name={person.name}
							profileUrl={person.profileUrl}
						/>

						<CreditsList credits={person.movieCredits} title="Notable Films" />
						<CreditsList credits={person.tvCredits} title="Notable TV Shows" />
					</div>
				</article>
			</Layout>
		</Document>,
	);
};
