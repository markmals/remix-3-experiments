export interface PersonKeyFact {
	label: string;
	value: string;
}

export interface PersonExternalLink {
	label: string;
	href: string;
}

export interface CreditSummary {
	id: number;
	title: string;
	character?: string;
	posterPath?: string;
	year?: number;
	href: string;
}

export interface NormalizedPersonDetails {
	pageTitle: string;
	name: string;
	biography: string;
	department: string;
	profileUrl?: string;
	keyFacts: PersonKeyFact[];
	externalLinks: PersonExternalLink[];
	movieCredits: CreditSummary[];
	tvCredits: CreditSummary[];
}
