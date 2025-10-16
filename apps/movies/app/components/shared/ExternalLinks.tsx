import { cssvar as $ } from "~/utils/css-var.ts";

export interface ExternalLink {
	label: string;
	href: string;
}

export interface ExternalLinksProps {
	links: ExternalLink[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
	if (links.length === 0) return null;

	return (
		<div
			css={{
				display: "flex",
				gap: $("spacing-3"),
				flexWrap: "wrap",
			}}
		>
			{links.map((link) => (
				<a
					key={link.label}
					css={{
						padding: `${$("spacing-2")} ${$("spacing-4")}`,
						borderRadius: $("radius-full"),
						background: $("jam-surface-alt"),
						border: `1px solid ${$("jam-border")}`,
						color: $("jam-text-primary"),
						fontSize: $("font-size-sm"),
						textDecoration: "none",
						textTransform: "uppercase",
						letterSpacing: $("letter-spacing-wide"),
						transition: $("jam-transition-card"),
						"&:hover": {
							borderColor: $("jam-border-strong"),
							background: $("jam-gradient-soft"),
						},
					}}
					href={link.href}
					rel="noopener noreferrer"
					target="_blank"
				>
					{link.label} →
				</a>
			))}
		</div>
	);
}
