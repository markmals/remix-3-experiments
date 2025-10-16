import { FALLBACK_POSTER, FALLBACK_PROFILE } from "./constants.ts";
import { prioritizeCrew } from "./crew.ts";
import {
	formatCountries,
	formatGenres,
	formatLanguages,
	formatReleaseDate,
	formatRuntime,
	formatStudios,
} from "./format.ts";
import type {
	MovieExternalLink,
	MovieKeyFact,
	MoviePhoto,
	NormalizedMovieDetails,
	PersonSummary,
} from "./types.ts";

type MovieDetails = {
	title?: string | null;
	release_date?: string | null;
	vote_average?: number | null;
	overview?: string | null;
	poster_path?: string | null;
	backdrop_path?: string | null;
	runtime?: number | null;
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
	images?: {
		backdrops?:
			| { file_path?: string | null; iso_639_1?: string | null }[]
			| null;
	} | null;
};

type MovieCredits = {
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

type MovieExternalIds = {
	imdb_id?: string | null;
};

function buildImageUrl(
	path?: string | null,
	size = "w500",
): string | undefined {
	if (!path) return undefined;
	return `https://image.tmdb.org/t/p/${size}${path}`;
}

function buildPhotoList(details: MovieDetails): MoviePhoto[] {
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
				? `${details.title ?? "Movie"} backdrop (${backdrop.iso_639_1})`
				: `${details.title ?? "Movie"} backdrop`,
			src: buildImageUrl(backdrop.file_path, "w780") ?? FALLBACK_POSTER,
		}));
}

function buildCastSummaries(credits: MovieCredits): PersonSummary[] {
	return (credits.cast ?? []).slice(0, 12).map((castMember) => ({
		id: castMember.id,
		name: castMember.name ?? "Unknown",
		caption: castMember.character ?? undefined,
		profileUrl:
			buildImageUrl(castMember.profile_path, "w300") ?? FALLBACK_PROFILE,
	}));
}

function buildCrewSummaries(credits: MovieCredits): PersonSummary[] {
	const prioritized = prioritizeCrew(credits.crew ?? []);
	return prioritized.slice(0, 12).map((member) => ({
		id: member.id,
		name: member.name ?? "Unknown",
		caption: member.job ?? undefined,
		profileUrl: buildImageUrl(member.profile_path, "w300") ?? FALLBACK_PROFILE,
	}));
}

function buildKeyFacts(details: MovieDetails): MovieKeyFact[] {
	const facts: MovieKeyFact[] = [];

	const releaseDate = formatReleaseDate(details.release_date);
	if (releaseDate) facts.push({ label: "Release Date", value: releaseDate });

	const countries = formatCountries(details.production_countries);
	if (countries) facts.push({ label: "Country", value: countries });

	const runtime = formatRuntime(details.runtime);
	if (runtime) facts.push({ label: "Runtime", value: runtime });

	const genres = formatGenres(details.genres);
	if (genres) facts.push({ label: "Genres", value: genres });

	if (details.status) facts.push({ label: "Status", value: details.status });

	const languages =
		formatLanguages(details.spoken_languages) ??
		details.original_language?.toUpperCase() ??
		undefined;
	if (languages) facts.push({ label: "Original Language", value: languages });

	const studios = formatStudios(details.production_companies);
	if (studios) facts.push({ label: "Studio", value: studios });

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

export function normalizeMovieDetails({
	details,
	credits,
	externalIds,
	movieId,
}: {
	details: MovieDetails;
	credits: MovieCredits;
	externalIds: MovieExternalIds | undefined;
	movieId: string;
}): NormalizedMovieDetails {
	const title = details.title ?? "Unknown Title";
	const year = details.release_date
		? new Date(details.release_date).getFullYear()
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

	const tmdbUrl = `https://www.themoviedb.org/movie/${movieId}`;
	const imdbUrl = externalIds?.imdb_id
		? `https://www.imdb.com/title/${externalIds.imdb_id}`
		: undefined;

	const externalLinks = buildExternalLinks(tmdbUrl, imdbUrl);

	return {
		pageTitle: `${title}${year ? ` (${year})` : ""} - Remix Movies`,
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
