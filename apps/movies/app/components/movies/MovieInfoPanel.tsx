import type { MovieExternalLink, MovieKeyFact } from "~/lib/movies/types.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

interface MovieInfoPanelProps {
	title: string;
	year?: number;
	overview: string;
	keyFacts: MovieKeyFact[];
	externalLinks: MovieExternalLink[];
}

export function MovieInfoPanel({
	title,
	year,
	overview,
	keyFacts,
	externalLinks,
}: MovieInfoPanelProps) {
	return (
		<div
			css={{
				display: "grid",
				gap: $("spacing-6"),
				alignContent: "start",
				padding: $("spacing-6"),
			}}
		>
			<header
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
			</header>
			<p
				css={{
					position: "relative",
					padding: $("spacing-4"),
					fontSize: "1.05rem",
					lineHeight: 1.8,
					color: $("jam-text-muted"),
					borderRadius: "1.2rem",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
					background:
						"linear-gradient(135deg, rgba(12, 16, 36, 0.55) 0%, rgba(26, 18, 46, 0.39) 45%, rgba(64, 22, 66, 0.28) 100%)",
					backdropFilter: "blur(14px)",
				}}
			>
				{overview}
			</p>
			<KeyFactsGrid facts={keyFacts} />
			<ExternalLinksRow links={externalLinks} />
		</div>
	);
}

function KeyFactsGrid({ facts }: { facts: MovieKeyFact[] }) {
	if (!facts.length) return null;

	return (
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
					gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
					gap: $("spacing-4"),
				}}
			>
				{facts.map((fact) => (
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
						key={fact.label}
					>
						<dt
							css={{
								fontSize: "0.7rem",
								letterSpacing: "0.26em",
								textTransform: "uppercase",
								color: $("jam-text-secondary"),
							}}
						>
							{fact.label}
						</dt>
						<dd
							css={{
								fontSize: "0.95rem",
								color: $("jam-text-primary"),
								margin: 0,
							}}
						>
							{fact.value}
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

function ExternalLinksRow({ links }: { links: MovieExternalLink[] }) {
	if (!links.length) return null;

	return (
		<div
			css={{
				display: "flex",
				flexWrap: "wrap",
				gap: $("spacing-3"),
			}}
		>
			{links.map((link) => (
				<a
					css={getLinkStyles(link.variant)}
					href={link.href}
					key={link.href}
					rel="noopener noreferrer"
					target="_blank"
				>
					{link.label}
				</a>
			))}
		</div>
	);
}

function getLinkStyles(variant: MovieExternalLink["variant"]) {
	switch (variant) {
		case "imdb":
			return {
				padding: "0.5rem 1.05rem",
				borderRadius: "999px",
				background:
					"linear-gradient(135deg, rgba(255, 196, 87, 0.2) 0%, rgba(255, 120, 63, 0.25) 100%)",
				color: $("jam-text-primary"),
				border: "1px solid rgba(255, 255, 255, 0.16)",
				boxShadow: "0 16px 30px rgba(9, 12, 38, 0.55)",
				fontSize: "0.72rem",
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
			};
		case "tmdb":
		default:
			return {
				padding: "0.5rem 1.05rem",
				borderRadius: "999px",
				background:
					"linear-gradient(135deg, rgba(63, 241, 255, 0.18) 0%, rgba(255, 73, 210, 0.22) 100%)",
				color: $("jam-text-primary"),
				border: "1px solid rgba(255, 255, 255, 0.16)",
				boxShadow: "0 16px 30px rgba(9, 12, 38, 0.55)",
				fontSize: "0.72rem",
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
			};
	}
}
