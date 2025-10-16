import { tmdb } from "~/lib/services/tmdb/client.ts";
import { normalizePersonDetails } from "./normalize.ts";
import type { NormalizedPersonDetails } from "./types.ts";

export async function loadPersonDetailsPage(
	personId: string,
): Promise<NormalizedPersonDetails | null> {
	const [details, credits, externalIds] = await Promise.all([
		tmdb.getPersonDetails(personId),
		tmdb.getPersonCombinedCredits(personId),
		tmdb.getPersonExternalIds(personId),
	]);

	if (!details) {
		return null;
	}

	return normalizePersonDetails({
		details,
		credits: credits ?? { cast: [] },
		externalIds,
	});
}
