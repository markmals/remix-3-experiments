import { cssvar as $ } from "~/utils/css-var.ts";

export interface KeyFact {
	label: string;
	value: string;
}

export interface KeyFactsProps {
	facts: KeyFact[];
}

export function KeyFacts({ facts }: KeyFactsProps) {
	if (facts.length === 0) return null;

	return (
		<div
			css={{
				display: "grid",
				gap: $("spacing-4"),
				padding: $("spacing-6"),
				borderRadius: $("radius-2xl"),
				background: $("jam-surface-alt"),
				border: `1px solid ${$("jam-border-soft")}`,
			}}
		>
			{facts.map((fact) => (
				<div key={fact.label} css={{ display: "grid", gap: $("spacing-2") }}>
					<span
						css={{
							fontSize: $("font-size-xs"),
							textTransform: "uppercase",
							letterSpacing: $("letter-spacing-wide"),
							color: $("jam-text-muted"),
						}}
					>
						{fact.label}
					</span>
					<span css={{ color: $("jam-text-primary") }}>{fact.value}</span>
				</div>
			))}
		</div>
	);
}
