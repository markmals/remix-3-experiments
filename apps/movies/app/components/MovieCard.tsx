import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

const FALLBACK_POSTER =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23040a1a'/><stop offset='48%' stop-color='%23121c3c'/><stop offset='100%' stop-color='%23ff3fb8'/></linearGradient></defs><rect width='400' height='600' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23f4f5ff' font-family='sans-serif' font-size='42' letter-spacing='8'>RMX</text></svg>";

export interface Movie {
	id: number;
	title?: string;
	poster_path?: string | null;
	vote_average: number;
	release_date?: string;
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
			? releaseDate.toLocaleDateString("en-US", {
					month: "short",
					year: "numeric",
				})
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

	return (
		<article
			css={{
				position: "relative",
				display: "grid",
				gap: $("spacing-4"),
				padding: $("spacing-4"),
				borderRadius: "1.5rem",
				background: $("jam-surface"),
				border: `1px solid ${$("jam-border")}`,
				boxShadow: $("jam-shadow-pop"),
				overflow: "hidden",
				transition:
					"transform 280ms ease, box-shadow 280ms ease, border 280ms ease",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: "1px",
					borderRadius: "calc(1.5rem - 1px)",
					background: $("jam-gradient-soft"),
					opacity: 0,
					transition: "opacity 300ms ease",
					zIndex: 0,
				},
				"&:hover": {
					transform: "translateY(-8px)",
					boxShadow: "0 28px 70px rgba(5, 7, 24, 0.55)",
					borderColor: "rgba(255, 255, 255, 0.16)",
				},
				"&:hover::before": {
					opacity: 1,
				},
				"&:hover .movie-poster": {
					transform: "scale(1.05)",
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
					borderRadius: "1.2rem",
					overflow: "hidden",
					background: $("jam-surface-alt"),
					border: "1px solid rgba(255, 255, 255, 0.08)",
					aspectRatio: "2 / 3",
					zIndex: 1,
				}}
				href={routes.movies.show.href({ id: movie.id.toString() })}
			>
				<img
					alt={`${movie.title ?? "Movie"} Poster`}
					class="movie-poster"
					css={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transition: "transform 360ms cubic-bezier(0.19, 1, 0.22, 1)",
						filter: "saturate(115%) contrast(108%)",
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
						background:
							"linear-gradient(180deg, rgba(5, 6, 18, 0) 55%, rgba(5, 6, 18, 0.75) 100%)",
						opacity: 0,
						transition: "opacity 260ms ease",
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
							gap: "0.35rem",
							padding: "0.35rem 0.6rem",
							borderRadius: "999px",
							background: "rgba(8, 10, 28, 0.8)",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							color: $("jam-text-primary"),
							fontSize: "0.75rem",
							letterSpacing: "0.18em",
							textTransform: "uppercase",
							boxShadow: "0 12px 24px rgba(5, 7, 24, 0.45)",
						}}
					>
						<span
							css={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: "1rem",
								height: "1rem",
								color: $("jam-glow-cyan"),
								fontSize: "0.85rem",
								lineHeight: 1,
								textShadow: "0 0 10px rgba(51, 241, 255, 0.75)",
							}}
						>
							★
						</span>
						{rating.toFixed(1)}
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
					gap: "0.6rem",
					zIndex: 1,
				}}
			>
				<a
					css={{
						display: "inline-flex",
						alignItems: "flex-start",
						gap: "0.6rem",
						fontSize: "1.05rem",
						fontWeight: 600,
						textTransform: "uppercase",
						color: $("jam-text-primary"),
						letterSpacing: "0.12em",
						textDecoration: "none",
						lineHeight: 1.35,
						minHeight: "3.2rem",
						transition: "color 200ms ease",
					}}
					class="movie-card-title"
					href={routes.movies.show.href({ id: movie.id.toString() })}
				>
					<span>{movie.title}</span>
				</a>
				<div
					css={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0.55rem 0.7rem",
						borderRadius: "0.95rem",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						background: "rgba(13, 16, 33, 0.7)",
						backdropFilter: "blur(18px)",
						color: $("jam-text-muted"),
						fontSize: "0.78rem",
						letterSpacing: "0.18em",
					}}
				>
					<div
						css={{
							display: "grid",
							gap: "0.15rem",
							textTransform: "uppercase",
						}}
					>
						<span css={{ fontSize: "0.65rem", opacity: 0.7 }}>Release</span>
						<span css={{ color: $("jam-text-primary") }}>{releaseLabel}</span>
					</div>
					<div
						css={{
							display: "grid",
							gap: "0.15rem",
							textTransform: "uppercase",
							textAlign: "right",
						}}
					>
						<span css={{ fontSize: "0.65rem", opacity: 0.7 }}>Status</span>
						<span css={{ color: statusColor }}>{status}</span>
					</div>
				</div>
			</div>
		</article>
	);
}
