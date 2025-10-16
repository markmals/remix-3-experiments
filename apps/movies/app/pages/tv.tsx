import { html, type InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import { MovieInfoPanel } from "~/components/movies/MovieInfoPanel.tsx";
import { PeopleCarousel } from "~/components/movies/PeopleCarousel.tsx";
import { PosterCard } from "~/components/movies/PosterCard.tsx";
import { MovieShowcase } from "~/components/sections/MovieShowcase.tsx";
import { Document } from "~/document.tsx";
import { type TMDb, tmdb } from "~/lib/services/tmdb/client.ts";
import { loadSeriesDetailsPage } from "~/lib/tv/loaders.ts";
import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";
import { render } from "~/utils/render.tsx";

type TrendingSeries = NonNullable<
	NonNullable<Awaited<ReturnType<TMDb["getTrendingTV"]>>>["results"]
>[number];

function mapSeriesToCard(series: TrendingSeries) {
	if (!series?.id) return null;

	return {
		id: series.id,
		title: series.name ?? series.original_name ?? "Untitled Series",
		poster_path: series.poster_path ?? undefined,
		vote_average:
			typeof series.vote_average === "number" ? series.vote_average : 0,
		release_date: series.first_air_date ?? undefined,
		href: routes.tv.show.href({ id: series.id.toString() }),
	};
}

export const index: InferRouteHandler<typeof routes.tv.index> = async ({
	url,
}) => {
	const trendingSeriesData = await tmdb.getTrendingTV();
	const trendingSeries = Array.isArray(trendingSeriesData?.results)
		? trendingSeriesData.results
		: [];

	const cards = trendingSeries
		.map(mapSeriesToCard)
		.filter((value): value is NonNullable<typeof value> => value !== null);

	return render(
		<Document title="Remix TV">
			<Layout currentUrl={url}>
				<MovieShowcase
					label={new Date().toDateString()}
					movies={cards}
					title="Trending TV Shows"
				/>
			</Layout>
		</Document>,
	);
};

export const show: InferRouteHandler<typeof routes.tv.show> = async ({
	params,
	url,
}) => {
	const seriesId = params.id;
	const series = await loadSeriesDetailsPage(seriesId);

	if (!series) {
		return html("Series not found", { status: 404 });
	}

	const cast = series.cast.map((person) => ({
		...person,
		href: person.id
			? routes.people.show.href({ id: person.id.toString() })
			: undefined,
	}));

	const crew = series.crew.map((person) => ({
		...person,
		href: person.id
			? routes.people.show.href({ id: person.id.toString() })
			: undefined,
	}));

	return render(
		<Document title={series.pageTitle}>
			<Layout currentUrl={url}>
				<article
					css={{
						position: "relative",
						width: "100%",
					}}
				>
					{series.backdropUrl ? (
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
								src={series.backdropUrl}
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
								id="series-poster"
								imageClass="series-poster"
								posterUrl={series.posterUrl}
								rating={series.rating}
								title={series.title}
							/>
							<MovieInfoPanel
								externalLinks={series.externalLinks}
								keyFacts={series.keyFacts}
								overview={series.overview}
								title={series.title}
								year={series.year}
							/>
						</div>

						<PeopleCarousel
							defaultCaption="Series Regular"
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
