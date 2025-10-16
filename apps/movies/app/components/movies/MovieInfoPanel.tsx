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
						fontSize: $("font-size-display-lg"),
						fontWeight: $("font-weight-bold"),
						letterSpacing: $("letter-spacing-extra-wide"),
						textTransform: "uppercase",
						color: $("jam-text-primary"),
						lineHeight: $("font-size-display-lg--line-height"),
						textShadow: $("shadow-text-glow"),
					}}
				>
					{title}
				</h1>
				{year ? (
					<div
						css={{
							fontSize: $("font-size-2xl"),
							fontWeight: $("font-weight-semibold"),
							letterSpacing: $("letter-spacing-widest"),
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
					fontSize: $("font-size-lg"),
					lineHeight: $("line-height-relaxed"),
					color: $("jam-text-muted"),
					borderRadius: $("radius-3xl"),
					border: `1px solid ${$("jam-border")}`,
					boxShadow: `${$("shadow-elevated-lg")}, ${$("shadow-inset-subtle")}`,
					background: $("gradient-accent-soft"),
					backdropFilter: `blur(${$("blur-lg")})`,
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
					fontSize: $("font-size-sm"),
					letterSpacing: $("letter-spacing-super-wide"),
					textTransform: "uppercase",
					color: $("jam-text-secondary"),
				}}
			>
				Key Facts
			</h2>
			<dl
				css={{
					display: "grid",
					gridTemplateColumns: `repeat(auto-fit, minmax(${$("spacing-44")}, 1fr))`,
					gap: $("spacing-4"),
				}}
			>
				{facts.map((fact) => (
					<div
						css={{
							display: "grid",
							gap: $("spacing-2"),
							padding: $("spacing-4"),
							borderRadius: $("radius-2xl"),
							background: $("jam-surface"),
							border: `1px solid ${$("jam-border")}`,
							boxShadow: `${$("shadow-elevated-lg")}, ${$("shadow-inset-subtle")}`,
						}}
						key={fact.label}
					>
						<dt
							css={{
								fontSize: $("font-size-xs"),
								letterSpacing: $("letter-spacing-super-wide"),
								textTransform: "uppercase",
								color: $("jam-text-secondary"),
							}}
						>
							{fact.label}
						</dt>
						<dd
							css={{
								fontSize: $("font-size-base"),
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
				padding: `${$("spacing-2")} ${$("spacing-4")}`,
				borderRadius: $("radius-full"),
				background: $("gradient-warm-primary"),
				color: $("jam-text-primary"),
				border: `1px solid ${$("jam-border")}`,
				boxShadow: $("shadow-elevated-lg"),
				fontSize: $("font-size-sm"),
				textTransform: "uppercase",
				letterSpacing: $("letter-spacing-ultra-wide"),
				transition: $("transition-elevate"),
				"&:hover": {
					transform: $("transform-raise-sm"),
					boxShadow: $("shadow-elevated-xl"),
					background: $("gradient-warm-primary"),
				},
			};
		// case "tmdb":
		default:
			return {
				padding: `${$("spacing-2")} ${$("spacing-4")}`,
				borderRadius: $("radius-full"),
				background: $("gradient-accent-primary"),
				color: $("jam-text-primary"),
				border: `1px solid ${$("jam-border")}`,
				boxShadow: $("shadow-elevated-lg"),
				fontSize: $("font-size-sm"),
				textTransform: "uppercase",
				letterSpacing: $("letter-spacing-ultra-wide"),
				transition: $("transition-elevate"),
				"&:hover": {
					transform: $("transform-raise-sm"),
					boxShadow: $("shadow-elevated-xl"),
					background: $("gradient-accent-primary"),
				},
			};
	}
}
