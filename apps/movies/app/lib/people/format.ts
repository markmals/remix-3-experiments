const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	year: "numeric",
});

const popularityFormatter = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

export function formatBirthday(birthday?: string | null): string | null {
	if (!birthday) return null;

	const date = new Date(birthday);
	if (Number.isNaN(date.getTime())) return null;

	return dateFormatter.format(date);
}

export function formatPopularity(popularity?: number | null): string | null {
	if (popularity === undefined || popularity === null) return null;
	if (!Number.isFinite(popularity)) return null;

	return popularityFormatter.format(popularity);
}

export function formatYear(dateString?: string | null): number | undefined {
	if (!dateString) return undefined;

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return undefined;

	return date.getFullYear();
}
