import type { tmdb } from "./client";

export type TheMovieDBSearchTVResults = Awaited<
	ReturnType<typeof tmdb.searchTV>
>;
