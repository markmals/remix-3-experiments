import type { MoviePhoto } from "~/lib/movies/types.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

interface PhotoHighlightsProps {
	photos: MoviePhoto[];
}

export function PhotoHighlights({ photos }: PhotoHighlightsProps) {
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
						fontSize: $("font-size-sm"),
						letterSpacing: $("letter-spacing-super-wide"),
						textTransform: "uppercase",
						color: $("jam-text-secondary"),
					}}
				>
					Photos
				</h2>
				<span
					css={{
						fontSize: $("font-size-xs"),
						color: $("jam-text-muted"),
						letterSpacing: $("letter-spacing-ultra-wide"),
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
					gridAutoColumns: `minmax(${$("spacing-56")}, ${$("jam-carousel-card-max-width")})`,
					gap: $("spacing-3"),
					overflowX: "auto",
					paddingBottom: $("spacing-2"),
					scrollSnapType: "x mandatory",
					WebkitOverflowScrolling: "touch",
					maskImage: $("jam-mask-horizontal-fade"),
					"&::-webkit-scrollbar": {
						height: $("jam-scrollbar-size"),
					},
					"&::-webkit-scrollbar-thumb": {
						background: $("jam-scrollbar-thumb"),
						borderRadius: $("radius-full"),
					},
				}}
			>
				{photos.map((photo) => (
					<figure
						css={{
							position: "relative",
							scrollSnapAlign: "center",
							borderRadius: $("radius-3xl"),
							overflow: "hidden",
							border: `1px solid ${$("jam-border")}`,
							boxShadow: $("jam-shadow-carousel"),
							transition: $("transition-elevate"),
							"&:hover": {
								transform: $("jam-transform-raise-md"),
								boxShadow: $("jam-shadow-carousel-hover"),
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
