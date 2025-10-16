import type { Route } from "@remix-run/fetch-router";
import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

const BRAND_HEIGHT = $("jam-brand-height");
const CONTENT_MAX_WIDTH = $("jam-content-max-width");
const COMPACT_MEDIA_QUERY = `@media (max-width: ${$("jam-breakpoint-compact")})`;

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
				zIndex: $("jam-z-nav"),
				backdropFilter: `blur(${$("blur-xl")})`,
				background: $("jam-nav-surface"),
				borderBottom: `1px solid ${$("jam-border")}`,
				boxShadow: $("jam-shadow-nav"),
			}}
		>
			<div
				css={{
					maxWidth: CONTENT_MAX_WIDTH,
					margin: "0 auto",
					padding: `${$("spacing-4")} ${$("spacing-4")}`,
					display: "grid",
					gridTemplateColumns: "1fr auto",
					alignItems: "center",
					gap: $("spacing-4"),
					[COMPACT_MEDIA_QUERY]: {
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
								transform: `translateY(${$("jam-logo-offset")})`,
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
							letterSpacing: $("jam-letter-spacing-brand"),
						}}
					>
						<span
							css={{
								display: "inline-flex",
								alignItems: "center",
								fontSize: $("jam-font-size-brand"),
								fontWeight: $("font-weight-semibold"),
								letterSpacing: $("jam-letter-spacing-accent"),
								lineHeight: 1,
								paddingTop: $("jam-spacing-offset-xs"),
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
						[COMPACT_MEDIA_QUERY]: {
							justifyContent: "space-between",
						},
					}}
				>
					<ul
						css={{
							display: "flex",
							alignItems: "center",
							gap: $("spacing-3"),
							padding: `${$("jam-chip-padding-y")} ${$("jam-chip-padding-x")}`,
							borderRadius: $("radius-full"),
							background: $("jam-overlay-chip"),
							border: `1px solid ${$("jam-border")}`,
							boxShadow: $("jam-shadow-chip-group"),
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
											padding: `${$("jam-chip-padding-y")} ${$("jam-chip-padding-x")}`,
											borderRadius: $("radius-full"),
											fontSize: $("font-size-sm"),
											letterSpacing: $("jam-letter-spacing-accent"),
											textTransform: "uppercase",
											color: isActive
												? $("jam-text-primary")
												: $("jam-text-muted"),
											textDecoration: "none",
											background: isActive
												? $("jam-chip-active-background")
												: "transparent",
											boxShadow: isActive ? $("jam-chip-shadow") : "none",
											border: isActive
												? `1px solid ${$("jam-border")}`
												: `1px solid ${$("color-transparent")}`,
											transition: $("jam-chip-transition"),
											"&:hover": {
												color: $("jam-text-primary"),
												background: $("jam-chip-hover-background"),
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
							gap: $("jam-spacing-relaxed"),
							padding: `${$("jam-button-padding-y")} ${$("jam-button-padding-x")}`,
							borderRadius: $("radius-full"),
							border: `1px solid ${$("jam-border")}`,
							background: $("jam-surface-alt"),
							boxShadow: $("jam-shadow-button"),
							textTransform: "uppercase",
							fontSize: $("font-size-xs"),
							letterSpacing: $("letter-spacing-super-wide"),
							color: $("jam-text-muted"),
						}}
						href="https://github.com/remix-run/remix"
						rel="noopener"
						target="_blank"
					>
						<span
							css={{
								display: "inline-flex",
								width: $("jam-indicator-width"),
								height: $("jam-indicator-height"),
								borderRadius: $("radius-full"),
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
