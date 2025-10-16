import { cssvar as $ } from "~/utils/css-var.ts";

const CONTENT_MAX_WIDTH = $("jam-content-max-width");
const COMPACT_MEDIA_QUERY = `@media (max-width: ${$("jam-breakpoint-compact")})`;

export function Footer() {
	return (
		<footer
			css={{
				position: "relative",
				marginTop: $("spacing-16"),
				borderTop: `1px solid ${$("jam-border")}`,
				background: $("jam-overlay-surface-footer"),
				boxShadow: $("jam-shadow-footer"),
			}}
		>
			<div
				aria-hidden="true"
				css={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: $("jam-border-thick"),
					background: $("jam-gradient-primary"),
				}}
			/>
			<div
				css={{
					maxWidth: CONTENT_MAX_WIDTH,
					margin: "0 auto",
					padding: `${$("spacing-6")} ${$("spacing-4")}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: $("spacing-4"),
					color: $("jam-text-muted"),
					fontSize: $("font-size-sm"),
					[COMPACT_MEDIA_QUERY]: {
						flexDirection: "column",
						alignItems: "flex-start",
					},
				}}
			>
				<div>
					<span
						css={{
							color: $("jam-text-primary"),
							fontWeight: $("font-weight-semibold"),
							textTransform: "uppercase",
						}}
					>
						Remix Movies
					</span>
					{/* <span css={{ marginLeft: "0.65rem", letterSpacing: "0.18em" }}>
						Boarding Pass Edition
					</span> */}
				</div>
				<div
				css={{
					display: "flex",
					alignItems: "center",
					gap: $("spacing-3"),
					textTransform: "uppercase",
					[COMPACT_MEDIA_QUERY]: {
						width: "100%",
						justifyContent: "space-between",
					},
					}}
				>
					Made By
				<a
					css={{
						color: $("jam-text-primary"),
						textDecoration: "none",
						position: "relative",
						fontSize: $("font-size-sm"),
						letterSpacing: $("jam-letter-spacing-accent"),
						"&::after": {
							content: '""',
							position: "absolute",
							left: 0,
							bottom: `calc(-1 * ${$("jam-spacing-offset-sm")})`,
							width: "100%",
							height: $("jam-border-thick"),
							background: $("jam-gradient-primary"),
							opacity: 0,
							transition: $("transition-fast"),
						},
						"&:hover::after": {
							opacity: 1,
						},
					}}
						href="https://bsky.app/profile/malstrom.me"
						rel="noopener noreferrer"
						target="_blank"
					>
						Mark Malstrom
					</a>
					<span aria-hidden="true" css={{ opacity: $("jam-opacity-divider") }}>
						•
					</span>
				<a
					css={{
						textDecoration: "none",
						color: $("jam-text-muted"),
						letterSpacing: $("jam-letter-spacing-accent"),
						fontSize: $("font-size-sm"),
						transition: $("transition-color"),
						"&:hover": {
							color: $("jam-text-primary"),
						},
					}}
						href="https://www.themoviedb.org/documentation/api"
						rel="noopener noreferrer"
						target="_blank"
					>
						Sourced from TMDb
					</a>
				</div>
			</div>
		</footer>
	);
}
