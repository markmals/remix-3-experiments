import { cssvar as $ } from "~/utils/css-var.ts";

interface PosterCardProps {
	title: string;
	posterUrl: string;
	rating?: number;
	id?: string;
	imageClass?: string;
}

export function PosterCard({
	title,
	posterUrl,
	rating,
	id,
	imageClass,
}: PosterCardProps) {
	return (
		<div
			css={{
				position: "relative",
				borderRadius: $("radius-3xl"),
				overflow: "hidden",
				background: $("jam-surface"),
				border: `1px solid ${$("jam-border")}`,
				boxShadow: $("jam-shadow-pop"),
				aspectRatio: $("jam-aspect-poster"),
			}}
		>
			<img
				alt={`${title} Poster`}
				class={imageClass}
				css={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
				}}
				id={id}
				src={posterUrl}
			/>
			{typeof rating === "number" ? (
				<div
					css={{
						position: "absolute",
						top: $("spacing-4"),
						left: $("spacing-4"),
						display: "flex",
						alignItems: "center",
					gap: $("spacing-2"),
					padding: `${$("spacing-2")} ${$("spacing-4")}`,
						borderRadius: $("radius-full"),
						background: $("jam-overlay-surface-strong"),
						border: `1px solid ${$("jam-border")}`,
						color: $("jam-text-primary"),
						fontSize: $("font-size-base"),
						letterSpacing: $("letter-spacing-ultra-wide"),
						textTransform: "uppercase",
						boxShadow: $("jam-shadow-float"),
					}}
				>
					<span
						css={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: $("spacing-5"),
							height: $("spacing-5"),
							color: $("jam-glow-cyan"),
							fontSize: $("font-size-base"),
							lineHeight: 1,
							textShadow: $("jam-text-shadow-glow"),
						}}
					>
						★
					</span>
					{rating.toFixed(1)}
				</div>
			) : null}
		</div>
	);
}
