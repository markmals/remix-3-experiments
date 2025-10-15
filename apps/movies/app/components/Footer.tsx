import { cssvar as $ } from "~/utils/css-var.ts";

export function Footer() {
	return (
		<footer
			css={{
				position: "relative",
				marginTop: $("spacing-16"),
				borderTop: `1px solid ${$("jam-border")}`,
				background: "rgba(8, 10, 24, 0.88)",
				boxShadow: "0 -18px 40px rgba(4, 6, 20, 0.45)",
			}}
		>
			<div
				aria-hidden="true"
				css={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "2px",
					background: $("jam-gradient-primary"),
				}}
			/>
			<div
				css={{
					maxWidth: "min(1160px, 94vw)",
					margin: "0 auto",
					padding: `${$("spacing-6")} ${$("spacing-4")}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: $("spacing-4"),
					color: $("jam-text-muted"),
					fontSize: "0.85rem",
					"@media (max-width: 720px)": {
						flexDirection: "column",
						alignItems: "flex-start",
					},
				}}
			>
				<div>
					<span
						css={{
							color: $("jam-text-primary"),
							fontWeight: 600,
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
						gap: "0.75rem",
						textTransform: "uppercase",
						"@media (max-width: 720px)": {
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
							fontSize: "0.8rem",
							letterSpacing: "0.14em",
							"&::after": {
								content: '""',
								position: "absolute",
								left: 0,
								bottom: "-0.35rem",
								width: "100%",
								height: "2px",
								background: $("jam-gradient-primary"),
								opacity: 0,
								transition: "opacity 200ms ease",
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
					<span aria-hidden="true" css={{ opacity: 0.5 }}>
						•
					</span>
					<a
						css={{
							textDecoration: "none",
							color: $("jam-text-muted"),
							letterSpacing: "0.14em",
							fontSize: "0.8rem",
							transition: "color 200ms ease",
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
