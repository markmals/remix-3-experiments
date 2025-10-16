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
					fontSize: "0.9rem",
					letterSpacing: "0.3em",
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
					gridAutoColumns: "minmax(200px, 240px)",
					gap: $("spacing-4"),
					overflowX: "auto",
					paddingBottom: $("spacing-2"),
					scrollSnapType: "x mandatory",
					WebkitOverflowScrolling: "touch",
					"&::-webkit-scrollbar": {
						height: "6px",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "rgba(255, 255, 255, 0.18)",
						borderRadius: "999px",
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
									aspectRatio: "3 / 4",
									borderRadius: "0.8rem",
									overflow: "hidden",
									border: "1px solid rgba(255, 255, 255, 0.08)",
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
									fontSize: "1rem",
									color: $("jam-text-primary"),
									letterSpacing: "0.08em",
									textTransform: "uppercase",
								}}
							>
								{person.name}
							</strong>
							{caption ? (
								<span
									css={{
										color: $("jam-text-muted"),
										fontSize: "0.85rem",
										letterSpacing: "0.14em",
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
						gap: "0.6rem",
						padding: "1rem",
						borderRadius: "1.1rem",
						background: $("jam-surface"),
						border: `1px solid ${$("jam-border")}`,
						boxShadow: $("jam-shadow-pop"),
						textDecoration: "none",
						color: $("jam-text-primary"),
						scrollSnapAlign: "center",
						transition:
							"transform 220ms ease, box-shadow 220ms ease, border 220ms ease",
						"&:hover": {
							transform: "translateY(-6px)",
							boxShadow: "0 30px 60px rgba(5, 7, 24, 0.55)",
							border: "1px solid rgba(255, 255, 255, 0.16)",
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
