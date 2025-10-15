import { client } from "./api/client";

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

    /** Fetch detailed movie info */
    async getMovieDetails(movieId: string | number) {
        const { data } = await client.GET("/3/movie/{movie_id}", {
            params: { path: { movie_id: Number(movieId) } },
        });
        return data;
    }
}

export const tmdb = new TMDb();
export type { TMDb };
