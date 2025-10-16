import { cssvar as $ } from "~/utils/css-var.ts";

export interface CarouselPerson {
	id?: number;
	name: string;
	caption?: string;
	profileUrl: string;
	href?: string;
}

interface PeopleCarouselProps {
	title: string;
	people: CarouselPerson[];
	defaultCaption?: string;
}

export function PeopleCarousel({
	title,
	people,
	defaultCaption,
}: PeopleCarouselProps) {
	if (!people.length) return null;

	return (
		<section
			css={{
				display: "grid",
				gap: $("spacing-4"),
				marginBottom: $("spacing-12"),
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
				{title}
			</h2>
			<div
				css={{
					display: "grid",
					gridAutoFlow: "column",
					gridAutoColumns: `minmax(${$("spacing-52")}, ${$("spacing-60")})`,
					gap: $("spacing-4"),
					overflowX: "auto",
					paddingBottom: $("spacing-2"),
					scrollSnapType: "x mandatory",
					WebkitOverflowScrolling: "touch",
					"&::-webkit-scrollbar": {
						height: $("jam-scrollbar-size"),
					},
					"&::-webkit-scrollbar-thumb": {
						background: $("jam-scrollbar-thumb"),
						borderRadius: $("radius-full"),
					},
				}}
			>
				{people.map((person) => {
					const caption = person.caption ?? defaultCaption;

					const card = (
						<>
							<div
								css={{
									position: "relative",
									width: "100%",
									aspectRatio: $("jam-aspect-portrait"),
									borderRadius: $("radius-2xl"),
									overflow: "hidden",
									border: `1px solid ${$("jam-border")}`,
								}}
							>
								<img
									alt={person.name}
									css={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
								}}
									src={person.profileUrl}
								/>
							</div>
							<strong
								css={{
									fontSize: $("font-size-base"),
									color: $("jam-text-primary"),
									letterSpacing: $("letter-spacing-extra-wide"),
									textTransform: "uppercase",
							}}
							>
								{person.name}
							</strong>
							{caption ? (
								<span
									css={{
										color: $("jam-text-muted"),
										fontSize: $("font-size-sm"),
										letterSpacing: $("letter-spacing-ultra-wide"),
										textTransform: "uppercase",
								}}
								>
									{caption}
								</span>
							) : null}
						</>
					);

					const sharedStyles = {
						display: "grid",
						gridTemplateRows: "auto auto 1fr",
						gap: $("spacing-3"),
						padding: $("spacing-4"),
						borderRadius: $("radius-3xl"),
						background: $("jam-surface"),
						border: `1px solid ${$("jam-border")}`,
						boxShadow: $("jam-shadow-pop"),
						textDecoration: "none",
						color: $("jam-text-primary"),
						scrollSnapAlign: "center",
						transition: $("transition-elevate"),
						"&:hover": {
							transform: $("jam-transform-raise-md"),
							boxShadow: $("jam-shadow-carousel-hover"),
							border: `1px solid ${$("jam-border-strong")}`,
						},
					};

					return person.href ? (
						<a
							css={sharedStyles}
							href={person.href}
							key={person.id ?? person.name}
						>
							{card}
						</a>
					) : (
						<div css={sharedStyles} key={person.id ?? person.name}>
							{card}
						</div>
					);
				})}
			</div>
		</section>
	);
}
