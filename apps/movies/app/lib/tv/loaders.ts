import { tmdb } from "~/lib/services/tmdb/client.ts";
import { normalizeSeriesDetails } from "./normalize.ts";
import type { NormalizedSeriesDetails } from "./normalize.ts";

export async function loadSeriesDetailsPage(
	seriesId: string,
): Promise<NormalizedSeriesDetails | null> {
	const [details, credits, externalIds] = await Promise.all([
		tmdb.getSeriesDetails(seriesId),
		tmdb.getSeriesCredits(seriesId),
		tmdb.getSeriesExternalIds(seriesId),
	]);

	if (!details) {
		return null;
	}

	return normalizeSeriesDetails({
		details,
		credits: credits ?? { cast: [], crew: [] },
		externalIds,
		seriesId,
	});
}
