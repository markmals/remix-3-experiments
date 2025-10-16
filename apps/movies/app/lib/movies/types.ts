export interface MovieKeyFact {
	label: string;
	value: string;
}

export type MovieExternalLinkVariant = "tmdb" | "imdb" | "default";

export interface MovieExternalLink {
	label: string;
	href: string;
	variant?: MovieExternalLinkVariant;
}

export interface MoviePhoto {
	id: string;
	alt: string;
	src: string;
}

export interface PersonSummary {
	id?: number;
	name: string;
	caption?: string;
	profileUrl: string;
}

export interface NormalizedMovieDetails {
	pageTitle: string;
	title: string;
	year?: number;
	rating?: number;
	overview: string;
	posterUrl: string;
	backdropUrl?: string;
	keyFacts: MovieKeyFact[];
	externalLinks: MovieExternalLink[];
	photos: MoviePhoto[];
	cast: PersonSummary[];
	crew: PersonSummary[];
	tmdbUrl: string;
	imdbUrl?: string;
}
