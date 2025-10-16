import { html, type InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import { MovieInfoPanel } from "~/components/movies/MovieInfoPanel.tsx";
import { PeopleCarousel } from "~/components/movies/PeopleCarousel.tsx";
// import { Photos } from "~/components/movies/PhotoHighlights.tsx";
import { PosterCard } from "~/components/movies/PosterCard.tsx";
import { MovieShowcase } from "~/components/sections/MovieShowcase.tsx";
import { Document } from "~/document.tsx";
import { loadMovieDetailsPage } from "~/lib/movies/loaders.ts";
import { tmdb } from "~/lib/services/tmdb/client.ts";
import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";
import { render } from "~/utils/render.tsx";

export const index: InferRouteHandler<typeof routes.index> = async ({
	url,
}) => {
	const popularMoviesData = await tmdb.getTrendingMovies();
	const popularMovies = popularMoviesData?.results ?? [];

	return render(
		<Document title="Remix Movies">
			<Layout currentUrl={url}>
				<MovieShowcase
					label={new Date().toDateString()}
					movies={popularMovies}
					title="Trending Movies"
				/>
			</Layout>
		</Document>,
	);
};

export const show: InferRouteHandler<typeof routes.movies.show> = async ({
	params,
	url,
}) => {
	const movieId = params.id;
	const movie = await loadMovieDetailsPage(movieId);

	if (!movie) {
		return html("Movie not found", { status: 404 });
	}

	const cast = movie.cast.map((person) => ({
		...person,
		href: person.id
			? routes.people.show.href({ id: person.id.toString() })
			: undefined,
	}));

	const crew = movie.crew.map((person) => ({
		...person,
		href: person.id
			? routes.people.show.href({ id: person.id.toString() })
			: undefined,
	}));

	return render(
		<Document title={movie.pageTitle}>
			<Layout currentUrl={url}>
				<article
					css={{
						position: "relative",
						width: "100%",
					}}
				>
					{movie.backdropUrl ? (
						<div
							css={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								height: "65vh",
								overflow: "hidden",
								zIndex: -1,
							}}
						>
							<div
								css={{
									position: "absolute",
									inset: 0,
									background: `linear-gradient(180deg, ${$("jam-bg")} 0%, transparent 20%, transparent 60%, ${$("jam-bg")} 100%)`,
									zIndex: 1,
								}}
							/>
							<img
								alt=""
								css={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
									filter: "brightness(0.4) saturate(1.2)",
								}}
								src={movie.backdropUrl}
							/>
						</div>
					) : null}

					<div
						css={{
							maxWidth: "min(1160px, 94vw)",
							margin: "0 auto",
							padding: `${$("spacing-16")} ${$("spacing-4")}`,
						}}
					>
						<div
							css={{
								display: "grid",
								gridTemplateColumns: "minmax(280px, 350px) 1fr",
								gap: $("spacing-8"),
								marginBottom: $("spacing-12"),
								"@media (max-width: 900px)": {
									gridTemplateColumns: "1fr",
								},
							}}
						>
							<PosterCard
								id="movie-poster"
								imageClass="movie-poster"
								posterUrl={movie.posterUrl}
								rating={movie.rating}
								title={movie.title}
							/>
							<MovieInfoPanel
								externalLinks={movie.externalLinks}
								keyFacts={movie.keyFacts}
								overview={movie.overview}
								title={movie.title}
								year={movie.year}
							/>
						</div>

						{/* <Photos photos={movie.photos} /> */}
						<PeopleCarousel
							defaultCaption="Featured Cast"
							people={cast}
							title="Top Cast"
						/>
						<PeopleCarousel people={crew} title="Creative Team" />
					</div>
				</article>
			</Layout>
		</Document>,
	);
};
