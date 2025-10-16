import type { MoviePhoto } from "~/lib/movies/types.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

interface PhotoHighlightsProps {
	photos: MoviePhoto[];
}

export function Photos({ photos }: PhotoHighlightsProps) {
	if (!photos.length) return null;

	return (
		<section
			css={{
				display: "grid",
				gap: $("spacing-3"),
				marginBottom: $("spacing-12"),
			}}
		>
			<header
				css={{
					display: "flex",
					alignItems: "baseline",
					justifyContent: "space-between",
					gap: $("spacing-4"),
				}}
			>
				<h2
					css={{
						fontSize: "0.9rem",
						letterSpacing: "0.3em",
						textTransform: "uppercase",
						color: $("jam-text-secondary"),
					}}
				>
					Photos
				</h2>
				<span
					css={{
						fontSize: "0.75rem",
						color: $("jam-text-muted"),
						letterSpacing: "0.18em",
					}}
				>
					{photos.length} {photos.length === 1 ? "image" : "images"}
				</span>
			</header>
			<div
				css={{
					position: "relative",
					display: "grid",
					gridAutoFlow: "column",
					gridAutoColumns: "minmax(220px, 360px)",
					gap: $("spacing-3"),
					overflowX: "auto",
					paddingBottom: $("spacing-2"),
					scrollSnapType: "x mandatory",
					WebkitOverflowScrolling: "touch",
					maskImage:
						"linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.65) 6%, rgba(0,0,0,0.85) 94%, transparent 100%)",
					"&::-webkit-scrollbar": {
						height: "6px",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "rgba(255, 255, 255, 0.18)",
						borderRadius: "999px",
					},
				}}
			>
				{photos.map((photo) => (
					<figure
						css={{
							position: "relative",
							scrollSnapAlign: "center",
							borderRadius: "1.2rem",
							overflow: "hidden",
							border: `1px solid ${$("jam-border")}`,
							boxShadow: "0 24px 36px rgba(5, 7, 24, 0.45)",
							transition: "transform 240ms ease, box-shadow 240ms ease",
							"&:hover": {
								transform: "translateY(-6px)",
								boxShadow: "0 40px 70px rgba(5, 7, 24, 0.55)",
							},
						}}
						key={photo.id}
					>
						<img
							alt={photo.alt}
							css={{
								display: "block",
								width: "100%",
								height: "100%",
								objectFit: "cover",
							}}
							src={photo.src}
						/>
					</figure>
				))}
			</div>
		</section>
	);
}
