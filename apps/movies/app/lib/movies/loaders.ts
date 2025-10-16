import { tmdb } from "~/lib/services/tmdb/client.ts";
import { normalizeMovieDetails } from "./normalize.ts";
import type { NormalizedMovieDetails } from "./types.ts";

export async function loadMovieDetailsPage(
	movieId: string,
): Promise<NormalizedMovieDetails | null> {
	const [details, credits, externalIds] = await Promise.all([
		tmdb.getMovieDetails(movieId),
		tmdb.getMovieCredits(movieId),
		tmdb.getMovieExternalIds(movieId),
	]);

	if (!details) {
		return null;
	}

	return normalizeMovieDetails({
		details,
		credits: credits ?? { cast: [], crew: [] },
		externalIds,
		movieId,
	});
}
