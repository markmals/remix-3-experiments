import type { MovieCardProps } from "~/components/MovieCard.tsx";
import { MovieCard } from "~/components/MovieCard.tsx";
import { prop } from "~/utils/css-prop.ts";

type MovieShowcaseProps = {
	title: string;
	label: string;
	movies: MovieCardProps["movie"][];
};

const sectionStyle = {
	position: "relative" as const,
	minWidth: "min(1160px, 94vw)",
	margin: "auto",
	padding: `0 ${prop("spacing-4")}`,
	display: "grid",
	gap: prop("spacing-6"),
};

const headerStyle = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: prop("spacing-4"),
	textTransform: "uppercase" as const,
	letterSpacing: "0.26em",
	color: prop("jam-text-muted"),
};

const flourishStyle = {
	display: "inline-flex",
	alignItems: "center",
	gap: "0.5rem",
	fontSize: "0.75rem",
	color: prop("jam-text-primary"),
};

const flourishBarStyle = {
	display: "inline-flex",
	width: "60px",
	height: "2px",
	borderRadius: "999px",
	background: prop("jam-gradient-primary"),
};

const gridStyle = {
	display: "grid",
	gap: prop("spacing-6"),
	gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

export function MovieShowcase({ title, label, movies }: MovieShowcaseProps) {
	return (
		<section class="popular-movies" css={sectionStyle}>
			<div css={headerStyle}>
				<span>{title}</span>
				<div css={flourishStyle}>
					<span css={flourishBarStyle} />
					{label}
				</div>
			</div>
			<div css={gridStyle}>
				{movies.map((movie) => (
					<MovieCard key={movie.id} movie={movie} />
				))}
			</div>
		</section>
	);
}
