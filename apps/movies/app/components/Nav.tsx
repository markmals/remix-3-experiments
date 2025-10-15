import { routes } from "~/routes.ts";
import { prop } from "~/utils/css-prop.ts";
import { Logo } from "./Logo.tsx";

const links = [
	{ label: "Movies", href: routes.index.href() },
	{ label: "TV Shows", href: routes.tv.index.href() },
	{ label: "People", href: routes.people.index.href() },
];

export function Nav() {
	return (
		<nav
			class="nav"
			css={{
				position: "sticky",
				top: 0,
				zIndex: 50,
				backdropFilter: "blur(18px)",
				background: "rgba(5, 6, 18, 0.85)",
				borderBottom: `1px solid ${prop("jam-border")}`,
				boxShadow: "0 18px 38px rgba(4, 6, 20, 0.55)",
			}}
		>
			<div
				css={{
					maxWidth: "min(1160px, 94vw)",
					margin: "0 auto",
					padding: `${prop("spacing-4")} ${prop("spacing-4")}`,
					display: "grid",
					gridTemplateColumns: "1fr auto",
					alignItems: "center",
					gap: prop("spacing-4"),
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
						gap: prop("spacing-3"),
						textDecoration: "none",
						color: prop("jam-text-primary"),
					}}
					href={routes.index.href()}
				>
					<span
						css={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "136px",
						}}
					>
						<Logo />
					</span>
					<span
						css={{
							display: "grid",
							gap: "0.25rem",
							textTransform: "uppercase",
							letterSpacing: "0.16em",
						}}
					>
						<span
							css={{
								fontSize: "1.05rem",
								fontWeight: 600,
								letterSpacing: "0.14em",
							}}
						>
							Remix Movies
						</span>
					</span>
				</a>
				<div
					css={{
						display: "flex",
						alignItems: "center",
						gap: prop("spacing-3"),
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
							gap: prop("spacing-3"),
							padding: "0.35rem 0.5rem",
							borderRadius: "999px",
							background: "rgba(13, 16, 33, 0.65)",
							border: `1px solid ${prop("jam-border")}`,
							boxShadow: "0 10px 30px rgba(4, 6, 18, 0.45)",
						}}
					>
						{links.map((link) => (
							<li key={link.label}>
								<a
									css={{
										position: "relative",
										display: "inline-flex",
										alignItems: "center",
										padding: "0.45rem 0.85rem",
										borderRadius: "999px",
										fontSize: "0.8rem",
										letterSpacing: "0.14em",
										textTransform: "uppercase",
										color: prop("jam-text-muted"),
										textDecoration: "none",
										transition: "color 200ms ease, background 200ms ease",
										"&:hover": {
											color: prop("jam-text-primary"),
											background: "rgba(27, 32, 60, 0.9)",
										},
									}}
									href={link.href}
								>
									{link.label}
								</a>
							</li>
						))}
					</ul>
					<a
						css={{
							display: "flex",
							alignItems: "center",
							gap: "0.65rem",
							padding: "0.35rem 1.25rem",
							borderRadius: "999px",
							border: `1px solid ${prop("jam-border")}`,
							background: prop("jam-surface-alt"),
							boxShadow: "0 12px 30px rgba(4, 6, 18, 0.45)",
							textTransform: "uppercase",
							fontSize: "0.7rem",
							letterSpacing: "0.3em",
							color: prop("jam-text-muted"),
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
								background: prop("jam-gradient-primary"),
							}}
						/>
						Remix 3 Preview
					</a>
				</div>
			</div>
		</nav>
	);
}
