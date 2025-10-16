import { FALLBACK_POSTER, FALLBACK_PROFILE } from "~/lib/movies/constants.ts";
import { prioritizeCrew } from "~/lib/movies/crew.ts";
import {
	formatCountries,
	formatGenres,
	formatLanguages,
	formatReleaseDate,
	formatStudios,
} from "~/lib/movies/format.ts";
import type {
	MovieExternalLink,
	MovieKeyFact,
	NormalizedMovieDetails,
	PersonSummary,
} from "~/lib/movies/types.ts";

type SeriesDetails = {
	name?: string | null;
	original_name?: string | null;
	first_air_date?: string | null;
	last_air_date?: string | null;
	vote_average?: number | null;
	overview?: string | null;
	poster_path?: string | null;
	backdrop_path?: string | null;
	episode_run_time?: number[] | null;
	number_of_seasons?: number | null;
	number_of_episodes?: number | null;
	genres?: { name?: string | null }[] | null;
	status?: string | null;
	original_language?: string | null;
	spoken_languages?:
		| {
				english_name?: string | null;
				name?: string | null;
				iso_639_1?: string | null;
		  }[]
		| null;
	production_companies?: { name?: string | null }[] | null;
	production_countries?:
		| { name?: string | null; iso_3166_1?: string | null }[]
		| null;
	networks?: { name?: string | null }[] | null;
	created_by?: { name?: string | null }[] | null;
	images?: {
		backdrops?:
			| { file_path?: string | null; iso_639_1?: string | null }[]
			| null;
	} | null;
};

type SeriesCredits = {
	cast?: Array<{
		id?: number;
		name?: string | null;
		character?: string | null;
		profile_path?: string | null;
		credit_id?: string;
	}>;
	crew?: Array<{
		id?: number;
		name?: string | null;
		job?: string | null;
		profile_path?: string | null;
		credit_id?: string;
	}>;
};

type SeriesExternalIds = {
	imdb_id?: string | null;
};

function buildImageUrl(
	path?: string | null,
	size = "w500",
): string | undefined {
	if (!path) return undefined;
	return `https://image.tmdb.org/t/p/${size}${path}`;
}

function buildPhotoList(details: SeriesDetails) {
	const backdrops = details.images?.backdrops ?? [];
	return backdrops
		.filter(
			(
				backdrop,
			): backdrop is { file_path: string; iso_639_1?: string | null } =>
				Boolean(backdrop?.file_path),
		)
		.slice(0, 10)
		.map((backdrop) => ({
			id: backdrop.file_path,
			alt: backdrop.iso_639_1
				? `${details.name ?? details.original_name ?? "Series"} backdrop (${backdrop.iso_639_1})`
				: `${details.name ?? details.original_name ?? "Series"} backdrop`,
			src: buildImageUrl(backdrop.file_path, "w780") ?? FALLBACK_POSTER,
		}));
}

function buildCastSummaries(credits: SeriesCredits): PersonSummary[] {
	return (credits.cast ?? []).slice(0, 12).map((castMember) => ({
		id: castMember.id,
		name: castMember.name ?? "Unknown",
		caption: castMember.character ?? undefined,
		profileUrl:
			buildImageUrl(castMember.profile_path, "w300") ?? FALLBACK_PROFILE,
	}));
}

function buildCrewSummaries(credits: SeriesCredits): PersonSummary[] {
	const prioritized = prioritizeCrew(credits.crew ?? []);
	return prioritized.slice(0, 12).map((member) => ({
		id: member.id,
		name: member.name ?? "Unknown",
		caption: member.job ?? undefined,
		profileUrl: buildImageUrl(member.profile_path, "w300") ?? FALLBACK_PROFILE,
	}));
}

const minuteFormatter = new Intl.NumberFormat("en-US", {
	style: "unit",
	unit: "minute",
	unitDisplay: "long",
});

const listFormatter = new Intl.ListFormat("en-US", {
	style: "narrow",
	type: "conjunction",
});

function formatEpisodeRuntime(runtime?: number[] | null): string | undefined {
	if (!runtime?.length) return undefined;
	const unique = [...new Set(runtime)].filter((value) =>
		Number.isFinite(value),
	);
	if (!unique.length) return undefined;
	if (unique.length === 1) {
		return minuteFormatter.format(unique[0]);
	}
	return `${minuteFormatter.format(Math.min(...unique))}-${minuteFormatter.format(Math.max(...unique))}`;
}

function formatNetworks(
	networks?: { name?: string | null }[] | null,
): string | undefined {
	const names =
		networks
			?.map((network) => network.name)
			.filter((name): name is string => Boolean(name)) ?? [];
	return names.length ? listFormatter.format(names) : undefined;
}

function formatCreators(
	creators?: { name?: string | null }[] | null,
): string | undefined {
	const names =
		creators
			?.map((creator) => creator.name)
			.filter((name): name is string => Boolean(name)) ?? [];
	return names.length ? listFormatter.format(names) : undefined;
}

function buildKeyFacts(details: SeriesDetails): MovieKeyFact[] {
	const facts: MovieKeyFact[] = [];

	const firstAirDate = formatReleaseDate(details.first_air_date);
	if (firstAirDate) {
		facts.push({ label: "First Air Date", value: firstAirDate });
	}

	const lastAirDate = formatReleaseDate(details.last_air_date);
	if (lastAirDate) {
		facts.push({ label: "Last Air Date", value: lastAirDate });
	}

	if (details.number_of_seasons) {
		facts.push({
			label: "Seasons",
			value: details.number_of_seasons.toString(),
		});
	}

	if (details.number_of_episodes) {
		facts.push({
			label: "Episodes",
			value: details.number_of_episodes.toString(),
		});
	}

	const runtime = formatEpisodeRuntime(details.episode_run_time);
	if (runtime) {
		facts.push({ label: "Episode Runtime", value: runtime });
	}

	const genres = formatGenres(details.genres);
	if (genres) {
		facts.push({ label: "Genres", value: genres });
	}

	if (details.status) {
		facts.push({ label: "Status", value: details.status });
	}

	const languages =
		formatLanguages(details.spoken_languages) ??
		details.original_language?.toUpperCase() ??
		undefined;
	if (languages) {
		facts.push({ label: "Original Language", value: languages });
	}

	const networks = formatNetworks(details.networks);
	if (networks) {
		facts.push({ label: "Networks", value: networks });
	}

	const creators = formatCreators(details.created_by);
	if (creators) {
		facts.push({ label: "Created By", value: creators });
	}

	const countries = formatCountries(details.production_countries);
	if (countries) {
		facts.push({ label: "Country", value: countries });
	}

	const studios = formatStudios(details.production_companies);
	if (studios) {
		facts.push({ label: "Studios", value: studios });
	}

	return facts;
}

function buildExternalLinks(
	tmdbUrl: string,
	imdbUrl?: string | null,
): MovieExternalLink[] {
	const links: MovieExternalLink[] = [
		{ label: "View on TMDb", href: tmdbUrl, variant: "tmdb" },
	];

	if (imdbUrl) {
		links.push({ label: "View on IMDb", href: imdbUrl, variant: "imdb" });
	}

	return links;
}

export function normalizeSeriesDetails({
	details,
	credits,
	externalIds,
	seriesId,
}: {
	details: SeriesDetails;
	credits: SeriesCredits;
	externalIds: SeriesExternalIds | undefined;
	seriesId: string;
}): NormalizedMovieDetails {
	const title = details.name ?? details.original_name ?? "Untitled Series";
	const year = details.first_air_date
		? new Date(details.first_air_date).getFullYear()
		: undefined;

	const rating = Number.isFinite(details.vote_average)
		? Math.round((details.vote_average ?? 0) * 10) / 10
		: undefined;

	const posterUrl = buildImageUrl(details.poster_path) ?? FALLBACK_POSTER;
	const backdropUrl = buildImageUrl(details.backdrop_path, "w1280");

	const overview = details.overview ?? "No overview available.";

	const keyFacts = buildKeyFacts(details);
	const photos = buildPhotoList(details);
	const cast = buildCastSummaries(credits);
	const crew = buildCrewSummaries(credits);

	const tmdbUrl = `https://www.themoviedb.org/tv/${seriesId}`;
	const imdbUrl = externalIds?.imdb_id
		? `https://www.imdb.com/title/${externalIds.imdb_id}`
		: undefined;

	const externalLinks = buildExternalLinks(tmdbUrl, imdbUrl);

	return {
		pageTitle: `${title}${year ? ` (${year})` : ""} - Remix TV Shows`,
		title,
		year,
		rating,
		overview,
		posterUrl,
		backdropUrl,
		keyFacts,
		externalLinks,
		photos,
		cast,
		crew,
		tmdbUrl,
		imdbUrl,
	};
}

export type NormalizedSeriesDetails = NormalizedMovieDetails;
