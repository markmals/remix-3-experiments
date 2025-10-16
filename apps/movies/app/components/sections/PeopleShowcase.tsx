import type { PersonCardProps } from "~/components/PersonCard.tsx";
import { PersonCard } from "~/components/PersonCard.tsx";
import { cssvar as $ } from "~/utils/css-var.ts";

type PeopleShowcaseProps = {
	title: string;
	label: string;
	people: PersonCardProps["person"][];
};

const sectionStyle = {
	position: "relative" as const,
	minWidth: $("jam-content-max-width"),
	margin: "auto",
	padding: `${$("spacing-16")} ${$("spacing-4")} ${$("spacing-10")}`,
	display: "grid",
	gap: $("spacing-6"),
};

const headerStyle = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: $("spacing-4"),
	textTransform: "uppercase" as const,
	letterSpacing: $("jam-letter-spacing-display"),
	color: $("jam-text-muted"),
};

const flourishStyle = {
	display: "inline-flex",
	alignItems: "center",
	gap: $("spacing-2"),
	fontSize: $("font-size-xs"),
	color: $("jam-text-primary"),
};

const flourishBarStyle = {
	display: "inline-flex",
	width: $("jam-flourish-width"),
	height: $("jam-border-thick"),
	borderRadius: $("radius-full"),
	background: $("jam-gradient-primary"),
};

const gridStyle = {
	display: "grid",
	gap: $("spacing-6"),
	gridTemplateColumns: `repeat(auto-fit, minmax(${$("spacing-56")}, 1fr))`,
};

export function PeopleShowcase({ title, label, people }: PeopleShowcaseProps) {
	return (
		<section class="popular-people" css={sectionStyle}>
			<div css={headerStyle}>
				<span>{title}</span>
				<div css={flourishStyle}>
					<span css={flourishBarStyle} />
					{label}
				</div>
			</div>
			<div css={gridStyle}>
				{people.map((person) => (
					<PersonCard key={person.id} person={person} />
				))}
			</div>
		</section>
	);
}
