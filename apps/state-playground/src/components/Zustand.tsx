import type { Remix } from "@remix-run/dom";
import { doc, dom, events } from "@remix-run/events";
import { store } from "~/lib/zustand.ts";

export interface Character {
	id: number;
	name: string;
}

export const useStarWarsStore = store({
	state: {
		characters: [] as Character[],
		selectedCharacter: null as number | null,
		isLoading: false,
	},
	getters: {
		get sortedCharacters(): Character[] {
			return this.characters.toSorted((lhs, rhs) => rhs.id - lhs.id);
		},
	},
	actions: {
		selectCharacter(character: Character | null): void {
			this.selectedCharacter = character?.id ?? null;
		},
		async fetchCharacter(id: number): Promise<void> {
			this.isLoading = true;
			const { name } = await fetch(`https://swapi.dev/api/people/${id}/`).then(
				(r) => r.json(),
			);
			this.isLoading = false;
			this.characters = [
				...this.characters.filter((c: Character) => c.id !== id),
				{ id, name },
			];
		},
	},
});

// const store = useStarWarsStore();
// events(store, [
// 	useStarWarsStore.update((event) => {
// 		console.log("Store updated:", event.detail);
// 	}),
// ]);

export function ZustandExample(this: Remix.Handle) {
	const store = useStarWarsStore(this);

	this.queueTask(() => {
		store.fetchCharacter(1);
	});

	events(document, [
		doc.click((event) => {
			if (
				!["input", "br", "ul", "li", "code"].includes(
					(event.target as Element).tagName.toLowerCase(),
				)
			) {
				store.selectCharacter(null);
			}
		}),
	]);

	return () => {
		return (
			<zustand-example
				css={{
					padding: "20px",
					maxWidth: "800px",
				}}
			>
				<input
					type="number"
					placeholder="Enter Numeric ID"
					min="1"
					value={1}
					on={dom.input((event) =>
						store.fetchCharacter(Number(event.currentTarget.value)),
					)}
				/>
				<br />
				{store.isLoading && <>Loading...</>}
				<br />
				<ul
					css={{
						display: "inline-block",
						width: "fit-content",
					}}
				>
					{store.sortedCharacters.map((character) => (
						<li
							key={character.id}
							css={{
								display: "block",
								width: "fit-content",
								"margin-bottom": "8px",

								cursor: "pointer",
								color: "var(--selected)",
							}}
							style={{
								"--selected":
									character.id === store.selectedCharacter ? "blue" : "black",
							}}
							on={dom.click(() => store.selectCharacter(character))}
						>
							<code>{JSON.stringify(character, null, 4)}</code>
						</li>
					))}
				</ul>
			</zustand-example>
		);
	};
}
