import type { InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import { MovieShowcase } from "~/components/sections/MovieShowcase.tsx";
import { Document } from "~/document.tsx";
import { tmdb } from "~/lib/services/tmdb/client.ts";
import type { routes } from "~/routes.ts";
import { render } from "~/utils/render.tsx";

export const homeHandler: InferRouteHandler<typeof routes.index> = async () => {
	const popularMoviesData = await tmdb.getPopularMovies();
	const popularMovies = popularMoviesData?.results ?? [];

	return render(
		<Document title="Remix Movies">
			<Layout>
				<MovieShowcase
					label="Remix Jam Playlist"
					movies={popularMovies}
					title="Spotlight Selection"
				/>
			</Layout>
		</Document>,
	);
};

export default homeHandler;
