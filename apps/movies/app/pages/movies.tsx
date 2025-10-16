import { html, type InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import { MovieShowcase } from "~/components/sections/MovieShowcase.tsx";
import { Document } from "~/document.tsx";
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

const FALLBACK_POSTER =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23040a1a'/><stop offset='48%' stop-color='%23121c3c'/><stop offset='100%' stop-color='%23ff3fb8'/></linearGradient></defs><rect width='400' height='600' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23f4f5ff' font-family='sans-serif' font-size='42' letter-spacing='8'>RMX</text></svg>";
const FALLBACK_PROFILE =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='p' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23040a1a'/><stop offset='70%' stop-color='%23121c3c'/><stop offset='100%' stop-color='%23ff3fb8'/></linearGradient></defs><rect width='200' height='200' rx='28' fill='url(%23p)'/><circle cx='100' cy='78' r='38' fill='rgba(255,255,255,0.18)'/><path d='M40 164c8-40 112-40 120 0' fill='rgba(255,255,255,0.12)'/></svg>";

export const show: InferRouteHandler<typeof routes.movies.show> = async ({
	params,
	url,
}) => {
	const movieId = params.id;

	// Fetch all data in parallel
	const [movieDetails, movieCredits, externalIds] = await Promise.all([
		tmdb.getMovieDetails(movieId),
		tmdb.getMovieCredits(movieId),
		tmdb.getMovieExternalIds(movieId),
	]);

	if (!movieDetails) {
		return html("Movie not found", { status: 404 });
	}

	// Extract and format data
	const title = movieDetails.title ?? "Unknown Title";
	const year = movieDetails.release_date
		? new Date(movieDetails.release_date).getFullYear()
		: undefined;
	const rating = Number.isFinite(movieDetails.vote_average)
		? Math.round(movieDetails.vote_average * 10) / 10
		: undefined;
	const releaseDate = movieDetails.release_date
		? new Date(movieDetails.release_date).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: "TBA";
	const runtime = movieDetails.runtime
		? `${Math.floor(movieDetails.runtime / 60)}h ${movieDetails.runtime % 60}m`
		: undefined;
	const genres =
		movieDetails.genres?.map((g) => g.name).join(", ") ?? "Unknown";
	const overview = movieDetails.overview ?? "No overview available.";
	const status = movieDetails.status ?? "Unknown";
	const language =
		movieDetails.spoken_languages
			?.map(
				(lang) =>
					lang.english_name ?? lang.name ?? lang.iso_639_1?.toUpperCase(),
			)
			.filter(Boolean)
			.join(", ") ??
		movieDetails.original_language?.toUpperCase() ??
		"Unknown";
	const countries =
		movieDetails.production_countries
			?.map((country) => country.name ?? country.iso_3166_1)
			.filter(Boolean)
			.join(", ") ?? "International";
	const studio =
		movieDetails.production_companies
			?.map((company) => company.name)
			.filter(Boolean)
			.join(", ") ?? "Independent";
	const posterUrl = movieDetails.poster_path
		? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
		: FALLBACK_POSTER;
	const backdropUrl = movieDetails.backdrop_path
		? `https://image.tmdb.org/t/p/w1280${movieDetails.backdrop_path}`
		: undefined;
	// FIXME: movieDetails.images does not exist
	// const photos =
	// 	movieDetails.images?.backdrops
	// 		?.filter((image) => image.file_path)
	// 		.slice(0, 10)
	// 		.map((image) => ({
	// 			id: image.file_path,
	// 			alt: image.iso_639_1
	// 				? `${title} backdrop (${image.iso_639_1})`
	// 				: `${title} backdrop`,
	// 			src: `https://image.tmdb.org/t/p/w780${image.file_path}`,
	// 		})) ?? [];

	// Cast and crew
	const cast = movieCredits?.cast?.slice(0, 12) ?? [];

	const crew = (() => {
		const allCrew = movieCredits?.crew ?? [];

		const directorMembers: typeof allCrew = [];
		const producerMembers: typeof allCrew = [];
		const otherMembers: typeof allCrew = [];

		for (const member of allCrew) {
			if (!member.job) {
				otherMembers.push(member);
				continue;
			}

			if (member.job === "Director") {
				directorMembers.push(member);
			} else if (member.job === "Producer" || member.job === "Executive Producer") {
				producerMembers.push(member);
			} else {
				otherMembers.push(member);
			}
		}

		const merged = [...directorMembers, ...producerMembers, ...otherMembers];
		return merged.slice(0, 12);
	})();

	// External links
	const imdbId = externalIds?.imdb_id;
	const tmdbUrl = `https://www.themoviedb.org/movie/${movieId}`;
	const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}` : undefined;

	return render(
		<Document title={`${title}${year ? ` (${year})` : ""} - Remix Movies`}>
			<Layout currentUrl={url}>
				<article
					css={{
						position: "relative",
						width: "100%",
					}}
				>
					{/* Backdrop */}
					{backdropUrl ? (
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
								src={backdropUrl}
							/>
						</div>
					) : null}

					{/* Content */}
					<div
						css={{
							maxWidth: "min(1160px, 94vw)",
							margin: "0 auto",
							padding: `${$("spacing-16")} ${$("spacing-4")}`,
						}}
					>
						{/* Header Section */}
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
							{/* Poster */}
							<div
								css={{
									position: "relative",
									borderRadius: "1.5rem",
									overflow: "hidden",
									background: $("jam-surface"),
									border: `1px solid ${$("jam-border")}`,
									boxShadow: $("jam-shadow-pop"),
									aspectRatio: "2 / 3",
								}}
							>
								<img
									alt={`${title} Poster`}
									class="movie-poster"
									css={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
									}}
									id="movie-poster"
									src={posterUrl}
								/>
								{typeof rating === "number" ? (
									<div
										css={{
											position: "absolute",
											top: $("spacing-4"),
											left: $("spacing-4"),
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
											padding: "0.6rem 1rem",
											borderRadius: "999px",
											background: "rgba(8, 10, 28, 0.9)",
											border: "1px solid rgba(255, 255, 255, 0.1)",
											color: $("jam-text-primary"),
											fontSize: "1rem",
											letterSpacing: "0.18em",
											textTransform: "uppercase",
											boxShadow: "0 12px 24px rgba(5, 7, 24, 0.45)",
										}}
									>
										<span
											css={{
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center",
												width: "1.2rem",
												height: "1.2rem",
												color: $("jam-glow-cyan"),
												fontSize: "1rem",
												lineHeight: 1,
												textShadow: "0 0 12px rgba(51, 241, 255, 0.8)",
											}}
										>
											★
										</span>
										{rating.toFixed(1)}
									</div>
								) : null}
							</div>

							{/* Info */}
							<div
								css={{
									display: "grid",
									gap: $("spacing-6"),
									alignContent: "start",
									padding: $("spacing-6"),
								}}
							>
								<div
									css={{
										display: "grid",
										gap: $("spacing-3"),
									}}
								>
									<h1
										css={{
											fontSize: "clamp(2rem, 5vw, 3.5rem)",
											fontWeight: 700,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: $("jam-text-primary"),
											lineHeight: 1.1,
											textShadow: "0 4px 20px rgba(51, 241, 255, 0.2)",
										}}
									>
										{title}
									</h1>
									{year ? (
										<div
											css={{
												fontSize: "1.4rem",
												fontWeight: 600,
												letterSpacing: "0.2em",
												color: $("jam-text-muted"),
											}}
										>
											{year}
										</div>
									) : null}
								</div>

								<p
									css={{
										position: "relative",
										padding: $("spacing-4"),
										borderRadius: "1.2rem",
										background:
											"linear-gradient(135deg, rgba(12, 16, 36, 0.85) 0%, rgba(26, 18, 46, 0.72) 45%, rgba(64, 22, 66, 0.64) 100%)",
										// border: "1px solid rgba(255, 255, 255, 0.08)",
										// boxShadow: "0 30px 60px rgba(6, 8, 24, 0.55)",
										backdropFilter: "blur(14px)",

										border: "1px solid rgba(255, 255, 255, 0.08)",
										fontSize: "1.05rem",
										lineHeight: 1.8,
										color: $("jam-text-muted"),
										boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
									}}
								>
									{overview}
								</p>

								<section
									css={{
										display: "grid",
										gap: $("spacing-4"),
									}}
								>
									<h2
										css={{
											fontSize: "0.82rem",
											letterSpacing: "0.32em",
											textTransform: "uppercase",
											color: $("jam-text-secondary"),
										}}
									>
										Key Facts
									</h2>
									<dl
										css={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fit, minmax(180px, 1fr))",
											gap: $("spacing-4"),
										}}
									>
										{[
											["Release Date", releaseDate],
											["Country", countries],
											["Runtime", runtime ?? "Unknown"],
											["Genres", genres],
											["Status", status],
											["Original Language", language],
											["Studio", studio],
										].map(([label, value]) => (
											<div
												css={{
													display: "grid",
													gap: "0.4rem",
													padding: "0.95rem",
													borderRadius: "1rem",
													background: $("jam-surface"),
													border: `1px solid ${$("jam-border")}`,
													boxShadow:
														"0 14px 30px rgba(4, 5, 18, 0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
												}}
												key={label}
											>
												<dt
													css={{
														fontSize: "0.7rem",
														letterSpacing: "0.26em",
														textTransform: "uppercase",
														color: $("jam-text-secondary"),
													}}
												>
													{label}
												</dt>
												<dd
													css={{
														fontSize: "0.95rem",
														color: $("jam-text-primary"),
														margin: 0,
													}}
												>
													{value}
												</dd>
											</div>
										))}
									</dl>
								</section>

								{/* External Links */}
								<div
									css={{
										display: "flex",
										flexWrap: "wrap",
										gap: $("spacing-3"),
									}}
								>
									<a
										css={{
											padding: "0.5rem 1.05rem",
											borderRadius: "999px",
											background:
												"linear-gradient(135deg, rgba(63, 241, 255, 0.18) 0%, rgba(255, 73, 210, 0.22) 100%)",
											color: $("jam-text-primary"),
											border: "1px solid rgba(255, 255, 255, 0.16)",
											boxShadow: "0 16px 30px rgba(9, 12, 38, 0.55)",
											fontSize: "0.75rem",
											textTransform: "uppercase",
											letterSpacing: "0.18em",
											transition:
												"transform 220ms ease, box-shadow 220ms ease, background 220ms ease",
											"&:hover": {
												transform: "translateY(-4px)",
												boxShadow: "0 28px 46px rgba(9, 12, 38, 0.65)",
												background:
													"linear-gradient(135deg, rgba(63, 241, 255, 0.28) 0%, rgba(255, 73, 210, 0.32) 100%)",
											},
										}}
										href={tmdbUrl}
										rel="noopener noreferrer"
										target="_blank"
									>
										View on TMDb
									</a>
									{imdbUrl ? (
										<a
											css={{
												padding: "0.5rem 1.05rem",
												borderRadius: "999px",
												background:
													"linear-gradient(135deg, rgba(255, 196, 87, 0.2) 0%, rgba(255, 120, 63, 0.25) 100%)",
												color: $("jam-text-primary"),
												border: "1px solid rgba(255, 255, 255, 0.16)",
												boxShadow: "0 16px 30px rgba(9, 12, 38, 0.55)",
												fontSize: "0.75rem",
												textTransform: "uppercase",
												letterSpacing: "0.18em",
												transition:
													"transform 220ms ease, box-shadow 220ms ease, background 220ms ease",
												"&:hover": {
													transform: "translateY(-4px)",
													boxShadow: "0 28px 46px rgba(9, 12, 38, 0.65)",
													background:
														"linear-gradient(135deg, rgba(255, 196, 87, 0.3) 0%, rgba(255, 120, 63, 0.35) 100%)",
												},
											}}
											href={imdbUrl}
											rel="noopener noreferrer"
											target="_blank"
										>
											View on IMDb
										</a>
									) : null}
								</div>
							</div>
						</div>

						{/* {photos.length ? (
							<section
								css={{
									display: "grid",
									gap: $("spacing-3"),
									marginBottom: $("spacing-12"),
								}}
							>
								<header
									css={{
										display: "flex",
										alignItems: "baseline",
										justifyContent: "space-between",
										gap: $("spacing-4"),
									}}
								>
									<h2
										css={{
											fontSize: "0.9rem",
											letterSpacing: "0.3em",
											textTransform: "uppercase",
											color: $("jam-text-secondary"),
										}}
									>
										Photo Highlights
									</h2>
									<span
										css={{
											fontSize: "0.75rem",
											color: $("jam-text-muted"),
											letterSpacing: "0.18em",
										}}
									>
										{photos.length} {photos.length === 1 ? "image" : "images"}
									</span>
								</header>
								<div
									css={{
										position: "relative",
										display: "grid",
										gridAutoFlow: "column",
										gridAutoColumns: "minmax(220px, 360px)",
										gap: $("spacing-3"),
										overflowX: "auto",
										paddingBottom: $("spacing-2"),
										scrollSnapType: "x mandatory",
										WebkitOverflowScrolling: "touch",
										maskImage:
											"linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.65) 6%, rgba(0,0,0,0.85) 94%, transparent 100%)",
										"&::-webkit-scrollbar": {
											height: "6px",
										},
										"&::-webkit-scrollbar-thumb": {
											background: "rgba(255, 255, 255, 0.18)",
											borderRadius: "999px",
										},
									}}
								>
									{photos.map((photo) => (
										<figure
											css={{
												position: "relative",
												scrollSnapAlign: "center",
												borderRadius: "1.2rem",
												overflow: "hidden",
												border: `1px solid ${$("jam-border")}`,
												boxShadow: "0 24px 36px rgba(5, 7, 24, 0.45)",
												transition:
													"transform 240ms ease, box-shadow 240ms ease",
												"&:hover": {
													transform: "translateY(-6px)",
													boxShadow: "0 40px 70px rgba(5, 7, 24, 0.55)",
												},
											}}
											key={photo.id}
										>
											<img
												alt={photo.alt}
												css={{
													display: "block",
													width: "100%",
													height: "100%",
													objectFit: "cover",
												}}
												src={photo.src}
											/>
										</figure>
									))}
								</div>
							</section>
						) : null} */}

						{cast.length ? (
							<section
								css={{
									display: "grid",
									gap: $("spacing-4"),
									marginBottom: $("spacing-12"),
								}}
							>
								<h2
									css={{
										fontSize: "0.9rem",
										letterSpacing: "0.3em",
										textTransform: "uppercase",
										color: $("jam-text-secondary"),
									}}
								>
									Top Cast
								</h2>
								<div
									css={{
										display: "grid",
										gridAutoFlow: "column",
										gridAutoColumns: "minmax(200px, 240px)",
										gap: $("spacing-4"),
										overflowX: "auto",
										paddingBottom: $("spacing-2"),
										scrollSnapType: "x mandatory",
										WebkitOverflowScrolling: "touch",
										"&::-webkit-scrollbar": {
											height: "6px",
										},
										"&::-webkit-scrollbar-thumb": {
											background: "rgba(255, 255, 255, 0.18)",
											borderRadius: "999px",
										},
									}}
								>
									{cast.map((member) => {
										const personHref = member.id
											? routes.people.show.href({ id: member.id.toString() })
											: undefined;
										const profileSrc = member.profile_path
											? `https://image.tmdb.org/t/p/w300${member.profile_path}`
											: FALLBACK_PROFILE;
										const key =
											member.id ??
											member.cast_id ??
											member.credit_id ??
											member.name;

										const cardCss = {
											display: "grid",
											gridTemplateRows: "auto auto 1fr",
											gap: "0.6rem",
											padding: "1rem",
											borderRadius: "1.1rem",
											background: $("jam-surface"),
											border: `1px solid ${$("jam-border")}`,
											boxShadow: $("jam-shadow-pop"),
											textDecoration: "none",
											color: $("jam-text-primary"),
											scrollSnapAlign: "center",
											transition:
												"transform 220ms ease, box-shadow 220ms ease, border 220ms ease",
											"&:hover": {
												transform: "translateY(-6px)",
												boxShadow: "0 30px 60px rgba(5, 7, 24, 0.55)",
												border: "1px solid rgba(255, 255, 255, 0.16)",
											},
										} as const;

										const content = (
											<>
												<div
													css={{
														position: "relative",
														width: "100%",
														aspectRatio: "3 / 4",
														borderRadius: "0.8rem",
														overflow: "hidden",
														border: "1px solid rgba(255, 255, 255, 0.08)",
													}}
												>
													<img
														alt={member.name ?? "Cast member"}
														css={{
															width: "100%",
															height: "100%",
															objectFit: "cover",
														}}
														src={profileSrc}
													/>
												</div>
												<strong
													css={{
														fontSize: "1rem",
														color: $("jam-text-primary"),
														letterSpacing: "0.08em",
														textTransform: "uppercase",
													}}
												>
													{member.name}
												</strong>
												{member.character ? (
													<span
														css={{
															color: $("jam-text-muted"),
															fontSize: "0.85rem",
															letterSpacing: "0.14em",
															textTransform: "uppercase",
														}}
													>
														as {member.character}
													</span>
												) : (
													<span
														css={{
															color: $("jam-text-muted"),
															fontSize: "0.8rem",
															letterSpacing: "0.14em",
															textTransform: "uppercase",
														}}
													>
														Featured Cast
													</span>
												)}
											</>
										);

										return personHref ? (
											<a css={cardCss} href={personHref} key={key}>
												{content}
											</a>
										) : (
											<div css={cardCss} key={key}>
												{content}
											</div>
										);
									})}
								</div>
							</section>
						) : null}

						{crew.length ? (
							<section
								css={{
									display: "grid",
									gap: $("spacing-4"),
								}}
							>
								<h2
									css={{
										fontSize: "0.9rem",
										letterSpacing: "0.3em",
										textTransform: "uppercase",
										color: $("jam-text-secondary"),
									}}
								>
									Creative Team
								</h2>
								<div
									css={{
										display: "grid",
										gridAutoFlow: "column",
										gridAutoColumns: "minmax(220px, 260px)",
										gap: $("spacing-4"),
										overflowX: "auto",
										paddingBottom: $("spacing-2"),
										scrollSnapType: "x mandatory",
										WebkitOverflowScrolling: "touch",
										"&::-webkit-scrollbar": {
											height: "6px",
										},
										"&::-webkit-scrollbar-thumb": {
											background: "rgba(255, 255, 255, 0.18)",
											borderRadius: "999px",
										},
									}}
								>
									{crew.map((member) => {
										const personHref = member.id
											? routes.people.show.href({ id: member.id.toString() })
											: undefined;
										const profileSrc = member.profile_path
											? `https://image.tmdb.org/t/p/w300${member.profile_path}`
											: FALLBACK_PROFILE;
										const key =
											member.id ??
											member.credit_id ??
											`${member.name}-${member.job}`;

										const cardCss = {
											display: "grid",
											gridTemplateRows: "auto auto 1fr",
											gap: "0.5rem",
											padding: "0.9rem",
											borderRadius: "1rem",
											background: "rgba(12, 14, 32, 0.85)",
											border: `1px solid ${$("jam-border")}`,
											textDecoration: "none",
											color: $("jam-text-primary"),
											scrollSnapAlign: "center",
											transition:
												"transform 220ms ease, box-shadow 220ms ease, border 220ms ease",
											"&:hover": {
												transform: "translateY(-6px)",
												boxShadow: "0 28px 58px rgba(5, 7, 24, 0.55)",
												border: "1px solid rgba(255, 255, 255, 0.16)",
											},
										} as const;

										const content = (
											<>
												<div
													css={{
														position: "relative",
														width: "100%",
														aspectRatio: "3 / 4",
														borderRadius: "0.8rem",
														overflow: "hidden",
														border: "1px solid rgba(255, 255, 255, 0.08)",
													}}
												>
													<img
														alt={member.name ?? "Crew member"}
														css={{
															width: "100%",
															height: "100%",
															objectFit: "cover",
														}}
														src={profileSrc}
													/>
												</div>
												<span
													css={{
														fontSize: "0.95rem",
														color: $("jam-text-primary"),
														letterSpacing: "0.1em",
														textTransform: "uppercase",
													}}
												>
													{member.name}
												</span>
												{member.job ? (
													<span
														css={{
															color: $("jam-text-muted"),
															fontSize: "0.8rem",
															letterSpacing: "0.16em",
															textTransform: "uppercase",
														}}
													>
														{member.job}
													</span>
												) : null}
											</>
										);

										return personHref ? (
											<a css={cardCss} href={personHref} key={key}>
												{content}
											</a>
										) : (
											<div css={cardCss} key={key}>
												{content}
											</div>
										);
									})}
								</div>
							</section>
						) : null}
					</div>
				</article>
			</Layout>
		</Document>,
	);
};
