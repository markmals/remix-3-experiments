import { routes } from "~/routes.ts";
import { formatBirthday, formatPopularity, formatYear } from "./format.ts";
import type {
	CreditSummary,
	NormalizedPersonDetails,
	PersonExternalLink,
	PersonKeyFact,
} from "./types.ts";

type PersonDetails = {
	name?: string | null;
	biography?: string | null;
	birthday?: string | null;
	place_of_birth?: string | null;
	known_for_department?: string | null;
	profile_path?: string | null;
	popularity?: number | null;
};

type PersonCredits = {
	cast?:
		| Array<{
				id?: number;
				media_type?: string;
				title?: string | null;
				name?: string | null;
				character?: string | null;
				poster_path?: string | null;
				release_date?: string | null;
				first_air_date?: string | null;
				popularity?: number | null;
		  }>
		| null;
};

type PersonExternalIds = {
	imdb_id?: string | null;
	instagram_id?: string | null;
	twitter_id?: string | null;
};

function buildImageUrl(
	path?: string | null,
	size = "w500",
): string | undefined {
	if (!path) return undefined;
	return `https://image.tmdb.org/t/p/${size}${path}`;
}

function buildKeyFacts(details: PersonDetails): PersonKeyFact[] {
	const facts: PersonKeyFact[] = [];

	const birthday = formatBirthday(details.birthday);
	if (birthday) facts.push({ label: "Born", value: birthday });

	if (details.place_of_birth) {
		facts.push({ label: "Birthplace", value: details.place_of_birth });
	}

	const popularity = formatPopularity(details.popularity);
	if (popularity) facts.push({ label: "Popularity", value: popularity });

	return facts;
}

function buildExternalLinks(externalIds: PersonExternalIds): PersonExternalLink[] {
	const links: PersonExternalLink[] = [];

	if (externalIds.imdb_id) {
		links.push({
			label: "IMDb",
			href: `https://www.imdb.com/name/${externalIds.imdb_id}`,
		});
	}

	if (externalIds.instagram_id) {
		links.push({
			label: "Instagram",
			href: `https://www.instagram.com/${externalIds.instagram_id}`,
		});
	}

	if (externalIds.twitter_id) {
		links.push({
			label: "Twitter",
			href: `https://twitter.com/${externalIds.twitter_id}`,
		});
	}

	return links;
}

function buildMovieCredits(credits: PersonCredits): CreditSummary[] {
	return (
		credits.cast
			?.filter((credit) => credit.media_type === "movie" && credit.id)
			.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
			.slice(0, 10)
			.map((credit) => ({
				id: credit.id!,
				title: credit.title ?? "Unknown",
				character: credit.character ?? undefined,
				posterPath: credit.poster_path ?? undefined,
				year: formatYear(credit.release_date),
				href: routes.movies.show.href({ id: credit.id!.toString() }),
			})) ?? []
	);
}

function buildTVCredits(credits: PersonCredits): CreditSummary[] {
	return (
		credits.cast
			?.filter((credit) => credit.media_type === "tv" && credit.id)
			.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
			.slice(0, 10)
			.map((credit) => ({
				id: credit.id!,
				title: credit.name ?? "Unknown",
				character: credit.character ?? undefined,
				posterPath: credit.poster_path ?? undefined,
				year: formatYear(credit.first_air_date),
				href: routes.tv.show.href({ id: credit.id!.toString() }),
			})) ?? []
	);
}

export function normalizePersonDetails({
	details,
	credits,
	externalIds,
}: {
	details: PersonDetails;
	credits: PersonCredits;
	externalIds: PersonExternalIds | undefined;
}): NormalizedPersonDetails {
	const name = details.name ?? "Unknown";
	const biography = details.biography ?? "No biography available.";
	const department = details.known_for_department ?? "Entertainment";
	const profileUrl = buildImageUrl(details.profile_path);

	const keyFacts = buildKeyFacts(details);
	const externalLinks = buildExternalLinks(externalIds ?? {});
	const movieCredits = buildMovieCredits(credits);
	const tvCredits = buildTVCredits(credits);

	return {
		pageTitle: `${name} - Remix People`,
		name,
		biography,
		department,
		profileUrl,
		keyFacts,
		externalLinks,
		movieCredits,
		tvCredits,
	};
}
