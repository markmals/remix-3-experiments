import type { InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import type { HeroStat } from "~/components/sections/HeroSection.tsx";
import { HeroSection } from "~/components/sections/HeroSection.tsx";
import { MovieShowcase } from "~/components/sections/MovieShowcase.tsx";
import { Document } from "~/document.tsx";
import { tmdb } from "~/lib/services/tmdb/client.ts";
import type { routes } from "~/routes.ts";
import { render } from "~/utils/render.tsx";

export const homeHandler: InferRouteHandler<typeof routes.index> = async () => {
	const popularMoviesData = await tmdb.getPopularMovies();
	const popularMovies = popularMoviesData?.results ?? [];

	const heroStats: HeroStat[] = [
		{ label: "Spotlight", value: "Festival Favorites", accent: "cyan" },
		{ label: "Palette", value: "Neon Noir", accent: "magenta" },
		{ label: "Soundtrack", value: "Retrowave Pulse", accent: "amber" },
		{ label: "Status", value: "Now Streaming", accent: "primary" },
	];

	return render(
		<Document title="Remix Movies">
			<Layout>
				<HeroSection stats={heroStats} />
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
