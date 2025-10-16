type CrewMember = {
	id?: number;
	name?: string | null;
	job?: string | null;
	profile_path?: string | null;
	credit_id?: string;
};

const PRODUCER_ROLES = new Set(["Producer", "Executive Producer"]);

export function prioritizeCrew<T extends CrewMember>(crew: T[]): T[] {
	const directors: T[] = [];
	const producers: T[] = [];
	const others: T[] = [];

	for (const member of crew) {
		if (!member.job) {
			others.push(member);
			continue;
		}

		if (member.job === "Director") {
			directors.push(member);
		} else if (PRODUCER_ROLES.has(member.job)) {
			producers.push(member);
		} else {
			others.push(member);
		}
	}

	return [...directors, ...producers, ...others];
}
