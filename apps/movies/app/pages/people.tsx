import { html, type InferRouteHandler } from "@remix-run/fetch-router";

import { Layout } from "~/components/Layout.tsx";
import { PeopleShowcase } from "~/components/sections/PeopleShowcase.tsx";
import { Document } from "~/document.tsx";
import { type TMDb, tmdb } from "~/lib/services/tmdb/client.ts";
import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";
import { render } from "~/utils/render.tsx";

type PopularPerson = NonNullable<
	NonNullable<Awaited<ReturnType<TMDb["getPopularPeople"]>>>["results"]
>[number];

function mapPersonToCard(person: PopularPerson) {
	if (!person?.id) return null;

	return {
		id: person.id,
		name: person.name ?? "Unknown",
		profile_path: person.profile_path ?? undefined,
		known_for_department: person.known_for_department ?? undefined,
		popularity: typeof person.popularity === "number" ? person.popularity : 0,
		href: routes.people.show.href({ id: person.id.toString() }),
	};
}

export const index: InferRouteHandler<typeof routes.people.index> = async ({
	url,
}) => {
	const popularPeopleData = await tmdb.getPopularPeople();
	const popularPeople = Array.isArray(popularPeopleData?.results)
		? popularPeopleData.results
		: [];

	const cards = popularPeople
		.map(mapPersonToCard)
		.filter((value): value is NonNullable<typeof value> => value !== null);

	return render(
		<Document title="Remix People">
			<Layout currentUrl={url}>
				<PeopleShowcase
					label={new Date().toDateString()}
					people={cards}
					title="Popular People"
				/>
			</Layout>
		</Document>,
	);
};

export const show: InferRouteHandler<typeof routes.people.show> = async ({
	params,
	url,
}) => {
	const personId = params.id;

	const [personData, creditsData, externalIdsData] = await Promise.all([
		tmdb.getPersonDetails(personId),
		tmdb.getPersonCombinedCredits(personId),
		tmdb.getPersonExternalIds(personId),
	]);

	if (!personData) {
		return html("Person not found", { status: 404 });
	}

	const name = personData.name ?? "Unknown";
	const biography = personData.biography ?? "No biography available.";
	const birthday = personData.birthday
		? new Date(personData.birthday).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: null;
	const birthplace = personData.place_of_birth ?? null;
	const department = personData.known_for_department ?? "Entertainment";
	const profileUrl = personData.profile_path
		? `https://image.tmdb.org/t/p/w500${personData.profile_path}`
		: null;

	const popularity = Number.isFinite(personData.popularity)
		? Math.round(personData.popularity * 10) / 10
		: null;

	const externalLinks: Array<{ label: string; href: string }> = [];
	if (externalIdsData?.imdb_id) {
		externalLinks.push({
			label: "IMDb",
			href: `https://www.imdb.com/name/${externalIdsData.imdb_id}`,
		});
	}
	if (externalIdsData?.instagram_id) {
		externalLinks.push({
			label: "Instagram",
			href: `https://www.instagram.com/${externalIdsData.instagram_id}`,
		});
	}
	if (externalIdsData?.twitter_id) {
		externalLinks.push({
			label: "Twitter",
			href: `https://twitter.com/${externalIdsData.twitter_id}`,
		});
	}

	// Get notable credits (movies and TV shows)
	const movieCredits =
		creditsData?.cast
			?.filter((credit) => credit.media_type === "movie")
			.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
			.slice(0, 10) ?? [];

	const tvCredits =
		creditsData?.cast
			?.filter((credit) => credit.media_type === "tv")
			.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
			.slice(0, 10) ?? [];

	return render(
		<Document title={`${name} - Remix People`}>
			<Layout currentUrl={url}>
				<article
					css={{
						position: "relative",
						width: "100%",
					}}
				>
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
							{/* Profile Image */}
							<div
								css={{
									position: "relative",
									borderRadius: $("radius-3xl"),
									overflow: "hidden",
									background: $("jam-surface"),
									border: `1px solid ${$("jam-border")}`,
									boxShadow: $("jam-shadow-pop"),
								}}
							>
								{profileUrl ? (
									<img
										alt={`${name} Profile`}
										css={{
											width: "100%",
											height: "auto",
											display: "block",
										}}
										src={profileUrl}
									/>
								) : (
									<div
										css={{
											aspectRatio: $("jam-aspect-poster"),
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											background: $("jam-gradient-soft"),
											color: $("jam-text-muted"),
											fontSize: $("font-size-2xl"),
										}}
									>
										No Photo
									</div>
								)}
							</div>

							{/* Info Panel */}
							<div
								css={{
									display: "grid",
									gap: $("spacing-6"),
									alignContent: "start",
								}}
							>
								<div>
									<h1
										css={{
											fontSize: $("font-size-4xl"),
											fontWeight: $("font-weight-bold"),
											textTransform: "uppercase",
											letterSpacing: $("jam-letter-spacing-title"),
											color: $("jam-text-primary"),
											marginBottom: $("spacing-2"),
										}}
									>
										{name}
									</h1>
									<p
										css={{
											fontSize: $("font-size-lg"),
											color: $("jam-text-muted"),
											textTransform: "uppercase",
											letterSpacing: $("letter-spacing-wide"),
										}}
									>
										{department}
									</p>
								</div>

								{/* Key Facts */}
								<div
									css={{
										display: "grid",
										gap: $("spacing-4"),
										padding: $("spacing-6"),
										borderRadius: $("radius-2xl"),
										background: $("jam-surface-alt"),
										border: `1px solid ${$("jam-border-soft")}`,
									}}
								>
									{birthday && (
										<div css={{ display: "grid", gap: $("spacing-2") }}>
											<span
												css={{
													fontSize: $("font-size-xs"),
													textTransform: "uppercase",
													letterSpacing: $("letter-spacing-wide"),
													color: $("jam-text-muted"),
												}}
											>
												Born
											</span>
											<span css={{ color: $("jam-text-primary") }}>
												{birthday}
											</span>
										</div>
									)}
									{birthplace && (
										<div css={{ display: "grid", gap: $("spacing-2") }}>
											<span
												css={{
													fontSize: $("font-size-xs"),
													textTransform: "uppercase",
													letterSpacing: $("letter-spacing-wide"),
													color: $("jam-text-muted"),
												}}
											>
												Birthplace
											</span>
											<span css={{ color: $("jam-text-primary") }}>
												{birthplace}
											</span>
										</div>
									)}
									{popularity && (
										<div css={{ display: "grid", gap: $("spacing-2") }}>
											<span
												css={{
													fontSize: $("font-size-xs"),
													textTransform: "uppercase",
													letterSpacing: $("letter-spacing-wide"),
													color: $("jam-text-muted"),
												}}
											>
												Popularity
											</span>
											<span css={{ color: $("jam-text-primary") }}>
												{popularity.toFixed(1)}
											</span>
										</div>
									)}
								</div>

								{/* External Links */}
								{externalLinks.length > 0 && (
									<div
										css={{
											display: "flex",
											gap: $("spacing-3"),
											flexWrap: "wrap",
										}}
									>
										{externalLinks.map((link) => (
											<a
												css={{
													padding: `${$("spacing-2")} ${$("spacing-4")}`,
													borderRadius: $("radius-full"),
													background: $("jam-surface-alt"),
													border: `1px solid ${$("jam-border")}`,
													color: $("jam-text-primary"),
													fontSize: $("font-size-sm"),
													textDecoration: "none",
													textTransform: "uppercase",
													letterSpacing: $("letter-spacing-wide"),
													transition: $("jam-transition-card"),
													"&:hover": {
														borderColor: $("jam-border-strong"),
														background: $("jam-gradient-soft"),
													},
												}}
												href={link.href}
												key={link.label}
												rel="noopener noreferrer"
												target="_blank"
											>
												{link.label} →
											</a>
										))}
									</div>
								)}

								{/* Biography */}
								{biography && (
									<div css={{ display: "grid", gap: $("spacing-3") }}>
										<h2
											css={{
												fontSize: $("font-size-xl"),
												fontWeight: $("font-weight-semibold"),
												textTransform: "uppercase",
												letterSpacing: $("letter-spacing-wide"),
												color: $("jam-text-primary"),
											}}
										>
											Biography
										</h2>
										<p
											css={{
												color: $("jam-text-muted"),
												lineHeight: 1.6,
												whiteSpace: "pre-wrap",
											}}
										>
											{biography}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Credits Sections */}
						{movieCredits.length > 0 && (
							<div
								css={{
									marginBottom: $("spacing-12"),
									display: "grid",
									gap: $("spacing-6"),
								}}
							>
								<h2
									css={{
										fontSize: $("font-size-2xl"),
										fontWeight: $("font-weight-bold"),
										textTransform: "uppercase",
										letterSpacing: $("letter-spacing-wide"),
										color: $("jam-text-primary"),
									}}
								>
									Notable Films
								</h2>
								<div
									css={{
										display: "grid",
										gap: $("spacing-4"),
									}}
								>
									{movieCredits.map((credit) => (
										<a
											css={{
												display: "flex",
												gap: $("spacing-4"),
												padding: $("spacing-4"),
												borderRadius: $("radius-2xl"),
												background: $("jam-surface"),
												border: `1px solid ${$("jam-border-soft")}`,
												textDecoration: "none",
												transition: $("jam-transition-card"),
												"&:hover": {
													borderColor: $("jam-border-strong"),
													background: $("jam-gradient-soft"),
												},
											}}
											href={routes.movies.show.href({
												id: credit.id!.toString(),
											})}
											key={credit.id}
										>
											{credit.poster_path && (
												<img
													alt={`${credit.title ?? "Movie"} Poster`}
													css={{
														width: $("spacing-16"),
														height: "auto",
														borderRadius: $("radius-lg"),
														border: `1px solid ${$("jam-border-soft")}`,
													}}
													src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
												/>
											)}
											<div css={{ display: "grid", gap: $("spacing-1") }}>
												<span
													css={{
														fontSize: $("font-size-lg"),
														fontWeight: $("font-weight-semibold"),
														color: $("jam-text-primary"),
													}}
												>
													{credit.title}
												</span>
												{credit.character && (
													<span
														css={{
															fontSize: $("font-size-sm"),
															color: $("jam-text-muted"),
														}}
													>
														as {credit.character}
													</span>
												)}
												{credit.release_date && (
													<span
														css={{
															fontSize: $("font-size-xs"),
															color: $("jam-text-muted"),
															textTransform: "uppercase",
															letterSpacing: $("letter-spacing-wide"),
														}}
													>
														{new Date(credit.release_date).getFullYear()}
													</span>
												)}
											</div>
										</a>
									))}
								</div>
							</div>
						)}

						{tvCredits.length > 0 && (
							<div css={{ display: "grid", gap: $("spacing-6") }}>
								<h2
									css={{
										fontSize: $("font-size-2xl"),
										fontWeight: $("font-weight-bold"),
										textTransform: "uppercase",
										letterSpacing: $("letter-spacing-wide"),
										color: $("jam-text-primary"),
									}}
								>
									Notable TV Shows
								</h2>
								<div
									css={{
										display: "grid",
										gap: $("spacing-4"),
									}}
								>
									{tvCredits.map((credit) => (
										<a
											css={{
												display: "flex",
												gap: $("spacing-4"),
												padding: $("spacing-4"),
												borderRadius: $("radius-2xl"),
												background: $("jam-surface"),
												border: `1px solid ${$("jam-border-soft")}`,
												textDecoration: "none",
												transition: $("jam-transition-card"),
												"&:hover": {
													borderColor: $("jam-border-strong"),
													background: $("jam-gradient-soft"),
												},
											}}
											href={routes.tv.show.href({ id: credit.id!.toString() })}
											key={credit.id}
										>
											{credit.poster_path && (
												<img
													alt={`${credit.media_type === "tv" ? ((credit as any).name ?? "TV Show") : ((credit as any).title ?? "Movie")} Poster`}
													css={{
														width: $("spacing-16"),
														height: "auto",
														borderRadius: $("radius-lg"),
														border: `1px solid ${$("jam-border-soft")}`,
													}}
													src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
												/>
											)}
											<div css={{ display: "grid", gap: $("spacing-1") }}>
												<span
													css={{
														fontSize: $("font-size-lg"),
														fontWeight: $("font-weight-semibold"),
														color: $("jam-text-primary"),
													}}
												>
													{credit.media_type === "tv"
														? ((credit as any).name ?? "Unknown")
														: ((credit as any).title ?? "Unknown")}
												</span>
												{credit.character && (
													<span
														css={{
															fontSize: $("font-size-sm"),
															color: $("jam-text-muted"),
														}}
													>
														as {credit.character}
													</span>
												)}
												{credit.media_type === "tv" &&
												(credit as any).first_air_date ? (
													<span
														css={{
															fontSize: $("font-size-xs"),
															color: $("jam-text-muted"),
															textTransform: "uppercase",
															letterSpacing: $("letter-spacing-wide"),
														}}
													>
														{new Date(
															(credit as any).first_air_date,
														).getFullYear()}
													</span>
												) : null}
											</div>
										</a>
									))}
								</div>
							</div>
						)}
					</div>
				</article>
			</Layout>
		</Document>,
	);
};
