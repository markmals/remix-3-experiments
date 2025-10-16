import { routes } from "~/routes.ts";
import { cssvar as $ } from "~/utils/css-var.ts";

const FALLBACK_PROFILE =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23040a1a'/><stop offset='48%' stop-color='%23121c3c'/><stop offset='100%' stop-color='%23ff3fb8'/></linearGradient></defs><rect width='400' height='600' fill='url(%23g)'/><circle cx='200' cy='220' r='80' fill='%23f4f5ff' opacity='0.3'/><path d='M120 400 Q200 320 280 400' stroke='%23f4f5ff' stroke-width='20' fill='none' opacity='0.3'/></svg>";

const popularityFormatter = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

export interface Person {
	id: number;
	name?: string;
	profile_path?: string | null;
	known_for_department?: string;
	popularity?: number;
	href?: string;
}

export type PersonCardProps = { person: Person };

export function PersonCard({ person }: PersonCardProps) {
	const popularity =
		person.popularity !== undefined && Number.isFinite(person.popularity)
			? Math.round(person.popularity * 10) / 10
			: undefined;
	const department = person.known_for_department ?? "Entertainment";
	const detailsHref =
		person.href ?? routes.people.show.href({ id: person.id.toString() });

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
				"&:hover .person-profile": {
					transform: $("jam-scale-poster-hover"),
				},
				"&:hover .profile-overlay": {
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
					alt={`${person.name ?? "Person"} Profile`}
					class="person-profile"
					css={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transition: $("jam-transition-poster"),
						filter: $("jam-filter-poster"),
					}}
					src={
						person.profile_path
							? `https://image.tmdb.org/t/p/w500${person.profile_path}`
							: FALLBACK_PROFILE
					}
				/>
				<div
					class="profile-overlay"
					css={{
						position: "absolute",
						inset: 0,
						background: $("jam-gradient-overlay-strong"),
						opacity: 0,
						transition: $("jam-transition-opacity"),
					}}
				/>
				{typeof popularity === "number" ? (
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
								color: $("jam-glow-magenta"),
								fontSize: $("font-size-sm"),
								lineHeight: 1,
								textShadow: $("jam-text-shadow-glow"),
							}}
						>
							♦
						</span>
						{popularityFormatter.format(popularity)}
					</div>
				) : null}
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
					class="person-card-title"
					href={detailsHref}
				>
					<span>{person.name}</span>
				</a>
				<div
					css={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
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
							textAlign: "center",
						}}
					>
						<span
							css={{
								fontSize: $("jam-font-size-2xs"),
								opacity: $("jam-opacity-muted"),
							}}
						>
							Known For
						</span>
						<span css={{ color: $("jam-text-primary") }}>{department}</span>
					</div>
				</div>
			</div>
		</article>
	);
}
