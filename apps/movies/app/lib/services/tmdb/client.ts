import { client } from "./api/client.ts";

class TMDb {
	async searchTV(query: string) {
		const { data } = await client.GET("/3/search/tv", {
			params: { query: { query } },
		});

		return data;
	}

	/** Fetch detailed TV series info */
	async getSeriesDetails(seriesId: string | number) {
		const { data } = await client.GET("/3/tv/{series_id}", {
			params: { path: { series_id: Number(seriesId) } },
		});
		return data;
	}

	/** Fetch popular movies */
	async getPopularMovies() {
		const { data } = await client.GET("/3/movie/popular");
		return data;
	}

	async getTrendingMovies() {
		const { data } = await client.GET("/3/trending/movie/{time_window}", {
			params: { path: { time_window: "day" } },
		});
		return data;
	}

	/** Fetch detailed movie info */
	async getMovieDetails(movieId: string | number) {
		const { data } = await client.GET("/3/movie/{movie_id}", {
			params: {
				path: { movie_id: Number(movieId) },
				query: { append_to_response: "images" },
			},
		});
		return data;
	}

	/** Fetch movie credits (cast and crew) */
	async getMovieCredits(movieId: string | number) {
		const { data } = await client.GET("/3/movie/{movie_id}/credits", {
			params: { path: { movie_id: Number(movieId) } },
		});
		return data;
	}

	/** Fetch external IDs for a movie (IMDb, etc.) */
	async getMovieExternalIds(movieId: string | number) {
		const { data } = await client.GET("/3/movie/{movie_id}/external_ids", {
			params: { path: { movie_id: Number(movieId) } },
		});
		return data;
	}
}

export const tmdb = new TMDb();
export type { TMDb };
