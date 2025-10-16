import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

const FALLBACK_POSTER =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23040a1a'/><stop offset='48%' stop-color='%23121c3c'/><stop offset='100%' stop-color='%23ff3fb8'/></linearGradient></defs><rect width='400' height='600' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23f4f5ff' font-family='sans-serif' font-size='42' letter-spacing='8'>RMX</text></svg>";

const releaseDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	year: "numeric",
});

const ratingFormatter = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

export interface Movie {
	id: number;
	title?: string;
	poster_path?: string | null;
	vote_average: number;
	release_date?: string;
	href?: string;
}

export type MovieCardProps = { movie: Movie };

export function MovieCard({ movie }: MovieCardProps) {
	const rating = Number.isFinite(movie.vote_average)
		? Math.round(movie.vote_average * 10) / 10
		: undefined;
	const releaseDate = (() => {
		if (!movie.release_date) return "TBA";
		const date = new Date(movie.release_date);
		return Number.isNaN(date.getTime()) ? movie.release_date : date;
	})();
	const releaseLabel =
		releaseDate instanceof Date
			? releaseDateFormatter.format(releaseDate)
			: releaseDate;
	const status = (() => {
		if (!(releaseDate instanceof Date) || Number.isNaN(releaseDate.getTime()))
			return "Unscheduled";
		const now = new Date();
		let monthsSinceRelease =
			(now.getFullYear() - releaseDate.getFullYear()) * 12 +
			(now.getMonth() - releaseDate.getMonth());
		if (now.getDate() < releaseDate.getDate()) {
			monthsSinceRelease -= 1;
		}
		if (monthsSinceRelease < 3) return "New Release";
		if (monthsSinceRelease < 6) return "Fresh Pick";
		if (monthsSinceRelease < 36) return "Recent Favorite";
		return "Cult Classic";
	})();
	const statusColor =
		status === "New Release"
			? $("jam-glow-magenta")
			: status === "Fresh Pick"
				? $("jam-glow-cyan")
				: $("jam-text-primary");
	const detailsHref =
		movie.href ?? routes.movies.show.href({ id: movie.id.toString() });

	return (
		<article
			css={{
				position: "relative",
				display: "grid",
				gap: $("spacing-4"),
				padding: $("spacing-4"),
				borderRadius: $("radius-3xl"),
				background: $("jam-surface"),
				border: `1px solid ${$("jam-border")}`,
				boxShadow: $("jam-shadow-pop"),
				overflow: "hidden",
				transition: $("jam-transition-card"),
				"&::before": {
					content: '""',
					position: "absolute",
					inset: $("jam-border-thin"),
					borderRadius: `calc(${$("radius-3xl")} - ${$("jam-border-thin")})`,
					background: $("jam-gradient-soft"),
					opacity: 0,
					transition: $("jam-transition-opacity"),
					zIndex: 0,
				},
				"&:hover": {
					transform: $("jam-transform-raise-lg"),
					boxShadow: $("jam-shadow-card-hover"),
					borderColor: $("jam-border-strong"),
				},
				"&:hover::before": {
					opacity: 1,
				},
				"&:hover .movie-poster": {
					transform: $("jam-scale-poster-hover"),
				},
				"&:hover .poster-overlay": {
					opacity: 1,
				},
			}}
		>
			<a
				css={{
					position: "relative",
					display: "block",
					borderRadius: $("radius-2xl"),
					overflow: "hidden",
					background: $("jam-surface-alt"),
					border: `1px solid ${$("jam-border-soft")}`,
					aspectRatio: $("jam-aspect-poster"),
					zIndex: 1,
				}}
				href={detailsHref}
			>
				<img
					alt={`${movie.title ?? "Movie"} Poster`}
					class="movie-poster"
					css={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transition: $("jam-transition-poster"),
						filter: $("jam-filter-poster"),
					}}
					src={
						movie.poster_path
							? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
							: FALLBACK_POSTER
					}
				/>
				<div
					class="poster-overlay"
					css={{
						position: "absolute",
						inset: 0,
						background: $("jam-gradient-overlay-strong"),
						opacity: 0,
						transition: $("jam-transition-opacity"),
					}}
				/>
				{typeof rating === "number" ? (
					<div
						css={{
							position: "absolute",
							top: $("spacing-3"),
							left: $("spacing-3"),
							display: "flex",
							alignItems: "center",
							gap: $("jam-spacing-compact"),
							padding: `${$("jam-rating-padding-y")} ${$("jam-rating-padding-x")}`,
							borderRadius: $("radius-full"),
							background: $("jam-overlay-rating"),
							border: `1px solid ${$("jam-border-muted")}`,
							color: $("jam-text-primary"),
							fontSize: $("font-size-xs"),
							letterSpacing: $("letter-spacing-ultra-wide"),
							textTransform: "uppercase",
							boxShadow: $("jam-shadow-highlight"),
						}}
					>
						<span
							css={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: $("spacing-4"),
								height: $("spacing-4"),
								color: $("jam-glow-cyan"),
								fontSize: $("font-size-sm"),
								lineHeight: 1,
								textShadow: $("jam-text-shadow-glow"),
							}}
						>
							★
						</span>
						{ratingFormatter.format(rating)}
					</div>
				) : null}
				<div
					css={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						borderRadius: "inherit",
					}}
				/>
			</a>
			<div
				css={{
					display: "grid",
					gap: $("jam-spacing-medium"),
					zIndex: 1,
				}}
			>
				<a
					css={{
						display: "inline-flex",
						alignItems: "flex-start",
						gap: $("jam-spacing-medium"),
						fontSize: $("font-size-lg"),
						fontWeight: $("font-weight-semibold"),
						textTransform: "uppercase",
						color: $("jam-text-primary"),
						letterSpacing: $("jam-letter-spacing-title"),
						textDecoration: "none",
						lineHeight: $("jam-line-height-title"),
						minHeight: $("jam-min-height-title"),
						transition: $("transition-color"),
					}}
					class="movie-card-title"
					href={detailsHref}
				>
					<span>{movie.title}</span>
				</a>
				<div
					css={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: `${$("spacing-2")} ${$("spacing-3")}`,
						borderRadius: $("radius-2xl"),
						border: `1px solid ${$("jam-border-soft")}`,
						background: $("jam-overlay-chip-strong"),
						backdropFilter: `blur(${$("blur-xl")})`,
						color: $("jam-text-muted"),
						fontSize: $("font-size-sm"),
						letterSpacing: $("letter-spacing-ultra-wide"),
					}}
				>
					<div
						css={{
							display: "grid",
							gap: $("jam-spacing-mini"),
							textTransform: "uppercase",
						}}
					>
						<span
							css={{
								fontSize: $("jam-font-size-2xs"),
								opacity: $("jam-opacity-muted"),
							}}
						>
							Release
						</span>
						<span css={{ color: $("jam-text-primary") }}>{releaseLabel}</span>
					</div>
					<div
						css={{
							display: "grid",
							gap: $("jam-spacing-mini"),
							textTransform: "uppercase",
							textAlign: "right",
						}}
					>
						<span
							css={{
								fontSize: $("jam-font-size-2xs"),
								opacity: $("jam-opacity-muted"),
							}}
						>
							Status
						</span>
						<span css={{ color: statusColor }}>{status}</span>
					</div>
				</div>
			</div>
		</article>
	);
}
