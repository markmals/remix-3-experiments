import { client } from "./api/client";
import type { MovieSearchResult, SearchResult, ShowSearchResult, TraktAirDate } from "./types";

class Trakt {
    async search(options: { query: string; type: "movie" }): Promise<MovieSearchResult[]>;
    async search(options: { query: string; type: "show" }): Promise<ShowSearchResult[]>;
    async search(options: { id: string; type: "movie" }): Promise<MovieSearchResult[]>;
    async search(options: { id: string; type: "show" }): Promise<ShowSearchResult[]>;
    async search<Result extends SearchResult>(
        options:
            | { query: string; id?: undefined; type: "movie" | "show" }
            | {
                  query?: undefined;
                  id: string;
                  type: "movie" | "show";
              },
    ): Promise<Result> {
        const { data } = options.id
            ? await client.GET("/search/{id_type}/{id}", {
                  params: { path: { id_type: "tmdb", id: options.id } },
              })
            : await client.GET("/search/{type}", {
                  params: { path: { type: options.type }, query: { query: options.query! } },
              });

        return data as any;
    }

    async airDates({ showId }: { showId: string }): Promise<TraktAirDate["airs"]> {
        // FIXME: figure out how to generate these definitions better so I can remove the `any`s
        const { data } = await client.GET("/shows/{id}", {
            params: { path: { id: showId }, query: { extended: "full" } as any },
        });

        return (data as any).airs;
    }
}

export const trakt = new Trakt();
export type { Trakt };
