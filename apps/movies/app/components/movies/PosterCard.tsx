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
				borderRadius: "1.5rem",
				overflow: "hidden",
				background: $("jam-surface"),
				border: `1px solid ${$("jam-border")}`,
				boxShadow: $("jam-shadow-pop"),
				aspectRatio: "2 / 3",
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
						gap: "0.5rem",
						padding: "0.6rem 1rem",
						borderRadius: "999px",
						background: "rgba(8, 10, 28, 0.9)",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						color: $("jam-text-primary"),
						fontSize: "1rem",
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
							width: "1.2rem",
							height: "1.2rem",
							color: $("jam-glow-cyan"),
							fontSize: "1rem",
							lineHeight: 1,
							textShadow: "0 0 12px rgba(51, 241, 255, 0.8)",
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
