import type { EnhancedStyleProperties } from "@remix-run/style";
import { prop } from "~/utils/css-prop.ts";

export type HeroStat = {
	label: string;
	value: string;
	accent?: "cyan" | "magenta" | "amber" | "primary";
};

const wrapperStyle = {
	position: "relative" as const,
	margin: "0 auto",
	maxWidth: "min(1160px, 94vw)",
	padding: `${prop("spacing-16")} ${prop("spacing-4")} ${prop("spacing-10")}`,
	display: "grid",
	gap: prop("spacing-6"),
} satisfies EnhancedStyleProperties;

const badgeStyle = {
	display: "inline-flex",
	alignItems: "center",
	gap: "0.4rem",
	padding: "0.35rem 0.85rem",
	borderRadius: "999px",
	border: `1px solid ${prop("jam-border")}`,
	background: "rgba(13, 16, 33, 0.65)",
	letterSpacing: "0.35em",
	textTransform: "uppercase" as const,
	fontSize: "0.7rem",
	color: prop("jam-text-muted"),
	width: "fit-content",
} satisfies EnhancedStyleProperties;

const headingGroupStyle = {
	display: "grid",
	gap: prop("spacing-4"),
	maxWidth: "48rem",
} satisfies EnhancedStyleProperties;

const headingStyle = {
	fontSize: "clamp(3rem, 5vw, 4.4rem)",
	letterSpacing: "0.08em",
	textTransform: "uppercase" as const,
	lineHeight: "1.05",
	fontWeight: 600,
} satisfies EnhancedStyleProperties;

const descriptionStyle = {
	color: prop("jam-text-muted"),
	fontSize: "1rem",
	maxWidth: "36rem",
	lineHeight: 1.7,
} satisfies EnhancedStyleProperties;

const statGridStyle = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
	gap: prop("spacing-3"),
	padding: "1rem",
	borderRadius: "1.25rem",
	border: `1px solid ${prop("jam-border")}`,
	background: "rgba(13, 16, 33, 0.7)",
	boxShadow: "0 25px 50px rgba(5, 7, 24, 0.4)",
} satisfies EnhancedStyleProperties;

const accentPalette: Record<NonNullable<HeroStat["accent"]>, string> = {
	cyan: prop("jam-glow-cyan"),
	magenta: prop("jam-glow-magenta"),
	amber: prop("jam-glow-amber"),
	primary: prop("jam-text-primary"),
} satisfies EnhancedStyleProperties;

export function HeroSection({ stats }: { stats: HeroStat[] }) {
	return (
		<header css={wrapperStyle}>
			<span css={badgeStyle}>
				<span
					css={{
						width: "8px",
						height: "8px",
						borderRadius: "50%",
						background: prop("jam-glow-magenta"),
						boxShadow: "0 0 8px rgba(255, 73, 210, 0.8)",
					}}
				/>
				Remix Jam Collection
			</span>

			<div css={headingGroupStyle}>
				<h1 css={headingStyle}>
					<span css={{ display: "block" }}>Spotlight Season</span>
					<span
						css={{
							display: "inline-flex",
							gap: "0.75rem",
							alignItems: "center",
						}}
					>
						Remix Movies{" "}
						<span
							css={{
								display: "inline-flex",
								alignItems: "center",
								padding: "0.35rem 0.75rem",
								borderRadius: "0.85rem",
								background: "rgba(13, 16, 33, 0.75)",
								border: `1px solid ${prop("jam-border")}`,
								fontSize: "0.8rem",
								letterSpacing: "0.3em",
								color: prop("jam-text-muted"),
							}}
						>
							Remix Jam ‘25
						</span>
					</span>
				</h1>
				<p css={descriptionStyle}>
					Tune into a spectrum of ecstatic cinema curated for Remix Jam Toronto.
					From neon-drenched thrillers to after-hours indies, the lineup glows
					with bold color, big sound, and the electric pulse of the festival
					crowd.
				</p>
			</div>

			<div css={statGridStyle}>
				{stats.map((stat) => (
					<div
						css={{
							display: "grid",
							gap: "0.35rem",
							textTransform: "uppercase",
							letterSpacing: "0.2em",
							fontSize: "0.72rem",
							color: prop("jam-text-muted"),
						}}
						key={stat.label}
					>
						<span>{stat.label}</span>
						<span
							css={{
								fontSize: "0.95rem",
								letterSpacing: "0.16em",
								color: stat.accent
									? accentPalette[stat.accent]
									: accentPalette.primary,
							}}
						>
							{stat.value}
						</span>
					</div>
				))}
			</div>
		</header>
	);
}
