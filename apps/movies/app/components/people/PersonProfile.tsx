import { cssvar as $ } from "~/utils/css-var.ts";
import { ExternalLinks, type ExternalLink } from "~/components/shared/ExternalLinks.tsx";
import { KeyFacts, type KeyFact } from "~/components/shared/KeyFacts.tsx";

export interface PersonProfileProps {
	name: string;
	department: string;
	biography: string;
	profileUrl?: string;
	keyFacts: KeyFact[];
	externalLinks: ExternalLink[];
}

export function PersonProfile({
	name,
	department,
	biography,
	profileUrl,
	keyFacts,
	externalLinks,
}: PersonProfileProps) {
	return (
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

				<KeyFacts facts={keyFacts} />
				<ExternalLinks links={externalLinks} />

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
	);
}
