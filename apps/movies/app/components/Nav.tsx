import type { Route } from "@remix-run/fetch-router";
import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

const BRAND_HEIGHT = "38px";

const links = [
	{
		label: "Movies",
		route: routes.index,
		matchers: [routes.index, routes.movies.show],
	},
	{
		label: "TV Shows",
		route: routes.tv.index,
		matchers: [routes.tv.index, routes.tv.show],
	},
	{
		label: "People",
		route: routes.people.index,
		matchers: [routes.people.index, routes.people.show],
	},
];

export function Nav({ currentUrl }: { currentUrl?: string | URL } = {}) {
	return (
		<nav
			class="nav"
			css={{
				position: "sticky",
				top: 0,
				zIndex: 50,
				backdropFilter: "blur(18px)",
				background: "rgba(5, 6, 18, 0.85)",
				borderBottom: `1px solid ${$("jam-border")}`,
				boxShadow: "0 18px 38px rgba(4, 6, 20, 0.55)",
			}}
		>
			<div
				css={{
					maxWidth: "min(1160px, 94vw)",
					margin: "0 auto",
					padding: `${$("spacing-4")} ${$("spacing-4")}`,
					display: "grid",
					gridTemplateColumns: "1fr auto",
					alignItems: "center",
					gap: $("spacing-4"),
					"@media (max-width: 720px)": {
						gridTemplateColumns: "1fr",
						justifyItems: "stretch",
					},
				}}
			>
				<a
					css={{
						display: "inline-flex",
						alignItems: "center",
						gap: $("spacing-3"),
						textDecoration: "none",
						color: $("jam-text-primary"),
					}}
					href={routes.index.href()}
				>
					<span
						css={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							height: BRAND_HEIGHT,
						}}
					>
						<img
							alt="Remix logo"
							css={{
								display: "block",
								height: "100%",
								width: "auto",
								transform: "translateY(2px)",
							}}
							height="269"
							src="/remix-logo.svg"
							width="819"
						/>
					</span>
					<span
						css={{
							display: "inline-flex",
							alignItems: "end",
							height: BRAND_HEIGHT,
							textTransform: "uppercase",
							letterSpacing: "0.16em",
						}}
					>
						<span
							css={{
								display: "inline-flex",
								alignItems: "center",
								fontSize: "1.72rem",
								fontWeight: 600,
								letterSpacing: "0.14em",
								lineHeight: 1,
								paddingTop: "2px",
							}}
						>
							Movies
						</span>
					</span>
				</a>
				<div
					css={{
						display: "flex",
						alignItems: "center",
						gap: $("spacing-3"),
						justifyContent: "flex-end",
						"@media (max-width: 720px)": {
							justifyContent: "space-between",
						},
					}}
				>
					<ul
						css={{
							display: "flex",
							alignItems: "center",
							gap: $("spacing-3"),
							padding: "0.35rem 0.5rem",
							borderRadius: "999px",
							background: "rgba(13, 16, 33, 0.65)",
							border: `1px solid ${$("jam-border")}`,
							boxShadow: "0 10px 30px rgba(4, 6, 18, 0.45)",
						}}
					>
						{links.map((link) => {
							const isActive = currentUrl
								? link.matchers.some((route: Route) => route.match(currentUrl))
								: false;

							return (
								<li key={link.label}>
									<a
										aria-current={isActive ? "page" : undefined}
										css={{
											position: "relative",
											display: "inline-flex",
											alignItems: "center",
											padding: "0.45rem 0.85rem",
											borderRadius: "999px",
											fontSize: "0.8rem",
											letterSpacing: "0.14em",
											textTransform: "uppercase",
											color: isActive
												? $("jam-text-primary")
												: $("jam-text-muted"),
											textDecoration: "none",
											background: isActive
												? "rgba(27, 32, 60, 0.85)"
												: "transparent",
											boxShadow: isActive
												? "0 12px 28px rgba(5, 7, 24, 0.45)"
												: "none",
											border: isActive
												? `1px solid ${$("jam-border")}`
												: "1px solid transparent",
											transition:
												"color 200ms ease, background 200ms ease, box-shadow 200ms ease, border 200ms ease",
											"&:hover": {
												color: $("jam-text-primary"),
												background: "rgba(27, 32, 60, 0.9)",
											},
										}}
										href={link.route.href()}
									>
										{link.label}
									</a>
								</li>
							);
						})}
					</ul>
					<a
						css={{
							display: "flex",
							alignItems: "center",
							gap: "0.65rem",
							padding: "0.35rem 1.25rem",
							borderRadius: "999px",
							border: `1px solid ${$("jam-border")}`,
							background: $("jam-surface-alt"),
							boxShadow: "0 12px 30px rgba(4, 6, 18, 0.45)",
							textTransform: "uppercase",
							fontSize: "0.7rem",
							letterSpacing: "0.3em",
							color: $("jam-text-muted"),
						}}
						href="https://github.com/remix-run/remix"
						rel="noopener"
						target="_blank"
					>
						<span
							css={{
								display: "inline-flex",
								width: "6px",
								height: "34px",
								borderRadius: "999px",
								background: $("jam-gradient-primary"),
							}}
						/>
						Remix 3 Preview
					</a>
				</div>
			</div>
		</nav>
	);
}
