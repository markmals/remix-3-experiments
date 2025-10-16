type LanguageLike = {
	english_name?: string | null;
	name?: string | null;
	iso_639_1?: string | null;
};

type CountryLike = {
	name?: string | null;
	iso_3166_1?: string | null;
};

type CompanyLike = {
	name?: string | null;
};

export function formatReleaseDate(
	dateString?: string | null,
): string | undefined {
	if (!dateString) return undefined;
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function formatRuntime(runtime?: number | null): string | undefined {
	if (!runtime || runtime <= 0) return undefined;
	const hours = Math.floor(runtime / 60);
	const minutes = runtime % 60;
	return `${hours}h ${minutes}m`;
}

export function formatGenres(
	genres?: { name?: string | null }[] | null,
): string | undefined {
	const names =
		genres
			?.map((genre) => genre.name)
			.filter((name): name is string => Boolean(name)) ?? [];
	return names.length ? names.join(", ") : undefined;
}

export function formatLanguages(
	languages?: LanguageLike[] | null,
): string | undefined {
	const names =
		languages
			?.map(
				(language) =>
					language.english_name ?? language.name ?? language.iso_639_1,
			)
			.filter((name): name is string => Boolean(name)) ?? [];

	return names.length ? names.join(", ") : undefined;
}

export function formatCountries(
	countries?: CountryLike[] | null,
): string | undefined {
	const names =
		countries
			?.map((country) => country.name ?? country.iso_3166_1)
			.filter((name): name is string => Boolean(name)) ?? [];

	return names.length ? names.join(", ") : undefined;
}

export function formatStudios(
	companies?: CompanyLike[] | null,
): string | undefined {
	const names =
		companies
			?.map((company) => company.name)
			.filter((name): name is string => Boolean(name)) ?? [];
	return names.length ? names.join(", ") : undefined;
}
