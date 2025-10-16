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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	year: "numeric",
});

export function formatReleaseDate(
	dateString?: string | null,
): string | undefined {
	if (!dateString) return undefined;
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return undefined;
	return dateFormatter.format(date);
}

const hourFormatter = new Intl.NumberFormat("en-US", {
	style: "unit",
	unit: "hour",
	unitDisplay: "short",
});

const minuteFormatter = new Intl.NumberFormat("en-US", {
	style: "unit",
	unit: "minute",
	unitDisplay: "short",
});

export function formatRuntime(runtime?: number | null): string | undefined {
	if (!runtime || runtime <= 0) return undefined;
	const hours = Math.floor(runtime / 60);
	const minutes = runtime % 60;

	if (hours > 0 && minutes > 0) {
		return `${hourFormatter.format(hours)} ${minuteFormatter.format(minutes)}`;
	}
	if (hours > 0) {
		return hourFormatter.format(hours);
	}
	return minuteFormatter.format(minutes);
}

const listFormatter = new Intl.ListFormat("en-US", {
	style: "narrow",
	type: "conjunction",
});

export function formatGenres(
	genres?: { name?: string | null }[] | null,
): string | undefined {
	const names =
		genres
			?.map((genre) => genre.name)
			.filter((name): name is string => Boolean(name)) ?? [];
	return names.length ? listFormatter.format(names) : undefined;
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

	return names.length ? listFormatter.format(names) : undefined;
}

export function formatCountries(
	countries?: CountryLike[] | null,
): string | undefined {
	const names =
		countries
			?.map((country) => country.name ?? country.iso_3166_1)
			.filter((name): name is string => Boolean(name)) ?? [];

	return names.length ? listFormatter.format(names) : undefined;
}

export function formatStudios(
	companies?: CompanyLike[] | null,
): string | undefined {
	const names =
		companies
			?.map((company) => company.name)
			.filter((name): name is string => Boolean(name)) ?? [];
	return names.length ? listFormatter.format(names) : undefined;
}
