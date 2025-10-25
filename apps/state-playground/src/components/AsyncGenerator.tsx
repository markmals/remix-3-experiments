import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { component } from "~/lib/async.ts";

interface Character {
    id: number;
    name: string;
    height: string;
    mass: string;
    birth_year: string;
    films: string[];
}

interface Film {
    title: string;
    episode_id: number;
    director: string;
    release_date: string;
}

interface SearchProps {
    characterId: number;
    loadFilms: boolean;
}

// Stateless component for loading states
function LoadingMessage({ message }: { message: string }) {
    return (
        <character-display>
            <div css={{ padding: "10px", fontStyle: "italic", color: "#666" }}>{message}</div>
        </character-display>
    );
}

// Stateless component for the character card
function CharacterCard({
    character,
    children,
}: {
    character: Character;
    children?: Remix.RemixNode;
}) {
    return (
        <character-display>
            <div
                css={{
                    padding: "15px",
                    backgroundColor: "#f0f8ff",
                    borderRadius: "8px",
                    marginBottom: "10px",
                }}
            >
                <h3 css={{ marginTop: 0, color: "#2c3e50" }}>{character.name}</h3>
                <div css={{ marginBottom: "8px" }}>
                    <strong>Height:</strong> {character.height}cm
                </div>
                <div css={{ marginBottom: "8px" }}>
                    <strong>Mass:</strong> {character.mass}kg
                </div>
                <div css={{ marginBottom: "8px" }}>
                    <strong>Birth Year:</strong> {character.birth_year}
                </div>
                {children}
            </div>
        </character-display>
    );
}

// Stateless component for the films section
function FilmsList({
    films,
    totalFilms,
    isComplete = false,
}: {
    films: Film[];
    totalFilms: number;
    isComplete?: boolean;
}) {
    const sortedFilms = films.toSorted((a, b) => a.episode_id - b.episode_id);

    return (
        <div css={{ marginTop: "15px" }}>
            <h4
                css={{
                    marginBottom: "10px",
                    color: isComplete ? "#27ae60" : "#2c3e50",
                }}
            >
                Films{" "}
                {isComplete
                    ? `(All ${films.length} Loaded)`
                    : `(Loaded ${films.length} of ${totalFilms})`}
                :
            </h4>
            <ul css={{ margin: 0, paddingLeft: "20px" }}>
                {sortedFilms.map(film => (
                    <li css={{ marginBottom: "8px" }} key={film.episode_id}>
                        <strong>Episode {film.episode_id}:</strong> {film.title} (
                        {film.release_date})
                        {isComplete && (
                            <div
                                css={{
                                    fontSize: "0.9em",
                                    color: "#666",
                                    marginTop: "2px",
                                }}
                            >
                                Directed by {film.director}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            {!isComplete && (
                <div
                    css={{
                        marginTop: "10px",
                        fontStyle: "italic",
                        color: "#666",
                    }}
                >
                    Loading more...
                </div>
            )}
        </div>
    );
}

// Async generator component that demonstrates imperative async/await
// This is the superpower: you can await and yield to control loading states naturally!
const CharacterDisplay = component<SearchProps>(async function* (props) {
    // Cache character data so we don't re-fetch when just toggling loadFilms
    const characterCache = new Map<number, Character>();

    for await (const { characterId, loadFilms } of props) {
        // Check if we have this character cached
        let character: Character;

        if (characterCache.has(characterId)) {
            character = characterCache.get(characterId)!;
        } else {
            // Show loading state while fetching character
            yield <LoadingMessage message={`Loading character ${characterId}...`} />;

            // Imperatively await the fetch!
            const characterResponse = await fetch(`https://swapi.dev/api/people/${characterId}/`);
            character = await characterResponse.json();

            // Cache it for next time
            characterCache.set(characterId, character);
        }

        if (!loadFilms) {
            // Just show the character without films
            yield (
                <CharacterCard character={character}>
                    <div css={{ fontStyle: "italic", color: "#666", marginTop: "10px" }}>
                        Enable "Load Films" to see more details
                    </div>
                </CharacterCard>
            );
        } else {
            // Show character with a loading state for films
            yield (
                <CharacterCard character={character}>
                    <div css={{ marginTop: "15px", fontStyle: "italic", color: "#666" }}>
                        Loading films ({character.films.length})...
                    </div>
                </CharacterCard>
            );

            // Imperatively await film fetches in sequence!
            const films: Film[] = [];
            for (const filmUrl of character.films) {
                const filmResponse = await fetch(filmUrl);
                const film: Film = await filmResponse.json();
                films.push(film);

                // Yield progress updates as each film loads!
                yield (
                    <CharacterCard character={character}>
                        <FilmsList
                            films={films}
                            isComplete={false}
                            totalFilms={character.films.length}
                        />
                    </CharacterCard>
                );
            }

            // Final render with all films loaded
            yield (
                <CharacterCard character={character}>
                    <FilmsList
                        films={films}
                        isComplete={true}
                        totalFilms={character.films.length}
                    />
                </CharacterCard>
            );
        }
    }
});

// Parent component that controls the props
// Demonstrates how props flow into async generator components
export function AsyncGeneratorExample(this: Remix.Handle) {
    let characterId = 1;
    let loadFilms = false;

    return () => (
        <async-generator-example
            css={{
                padding: "20px",
                maxWidth: "800px",
            }}
        >
            <div
                css={{
                    marginBottom: "30px",
                    padding: "15px",
                    backgroundColor: "#e8f4f8",
                    borderRadius: "8px",
                    border: "2px solid #4a9eff",
                }}
            >
                <h2 css={{ marginTop: 0 }}>Async Generator Component Demo</h2>
                <p css={{ color: "#666", marginBottom: "20px" }}>
                    Watch how the component yields different UI states as it imperatively awaits
                    async operations. Change the controls to see it in action!
                </p>

                <div css={{ marginBottom: "15px" }}>
                    <label css={{ display: "block", marginBottom: "8px" }} for="character-id">
                        <strong>Character ID (1-10):</strong>
                    </label>
                    <input
                        css={{
                            width: "100%",
                            padding: "10px",
                            fontSize: "16px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                        id="character-id"
                        max="10"
                        min="1"
                        on={dom.input(event => {
                            const value = parseInt(event.currentTarget.value);
                            if (value >= 1 && value <= 10) {
                                characterId = value;
                                this.update();
                            }
                        })}
                        type="number"
                        value={characterId}
                    />
                </div>

                <div css={{ marginBottom: "10px" }}>
                    <label
                        css={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            userSelect: "none",
                        }}
                    >
                        <input
                            checked={loadFilms}
                            css={{ marginRight: "8px" }}
                            on={dom.change(event => {
                                loadFilms = event.currentTarget.checked;
                                this.update();
                            })}
                            type="checkbox"
                        />
                        <strong>Load Films (watch progress updates!)</strong>
                    </label>
                    <div css={{ marginLeft: "28px", fontSize: "0.9em", color: "#666" }}>
                        When enabled, the component will yield UI updates after each film loads
                    </div>
                </div>
            </div>

            <CharacterDisplay characterId={characterId} loadFilms={loadFilms} />
        </async-generator-example>
    );
}
