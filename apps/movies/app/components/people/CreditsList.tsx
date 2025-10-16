import { cssvar as $ } from "~/utils/css-var.ts";

export interface Credit {
	id: number;
	title: string;
	character?: string;
	posterPath?: string;
	year?: number;
	href: string;
}

export interface CreditsListProps {
	title: string;
	credits: Credit[];
}

export function CreditsList({ title, credits }: CreditsListProps) {
	if (credits.length === 0) return null;

	return (
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
				{title}
			</h2>
			<div
				css={{
					display: "grid",
					gap: $("spacing-4"),
				}}
			>
				{credits.map((credit) => (
					<a
						key={credit.id}
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
						href={credit.href}
					>
						{credit.posterPath && (
							<img
								alt={`${credit.title} Poster`}
								css={{
									width: $("spacing-16"),
									height: "auto",
									borderRadius: $("radius-lg"),
									border: `1px solid ${$("jam-border-soft")}`,
								}}
								src={`https://image.tmdb.org/t/p/w185${credit.posterPath}`}
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
							{credit.year && (
								<span
									css={{
										fontSize: $("font-size-xs"),
										color: $("jam-text-muted"),
										textTransform: "uppercase",
										letterSpacing: $("letter-spacing-wide"),
									}}
								>
									{credit.year}
								</span>
							)}
						</div>
					</a>
				))}
			</div>
		</div>
	);
}
