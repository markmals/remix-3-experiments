export function formatBirthday(birthday?: string | null): string | null {
	if (!birthday) return null;

	const date = new Date(birthday);
	if (Number.isNaN(date.getTime())) return null;

	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function formatPopularity(popularity?: number | null): string | null {
	if (popularity === undefined || popularity === null) return null;
	if (!Number.isFinite(popularity)) return null;

	return (Math.round(popularity * 10) / 10).toFixed(1);
}

export function formatYear(dateString?: string | null): number | undefined {
	if (!dateString) return undefined;

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return undefined;

	return date.getFullYear();
}
