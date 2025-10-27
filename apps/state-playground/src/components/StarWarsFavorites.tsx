import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { get, set } from "idb-keyval";
import { use, useActionState, useOptimistic } from "~/lib/hooks.ts";
import { Suspense } from "~/lib/suspense.tsx";

interface Character {
    name: string;
    url: string;
    height: string;
    mass: string;
    birth_year: string;
    gender: string;
}

const FAVORITES_KEY = "starwars-favorites";

// Helper to get character ID from URL
function getCharacterId(url: string): string {
    const matches = url.match(/\/people\/(\d+)/);
    return matches ? matches[1] : "";
}

type FavoritesAction =
    | { type: "init"; favorites: Set<string> }
    | { type: "toggle"; characterId: string };

// Load favorites from IndexedDB
async function loadFavorites(): Promise<Set<string>> {
    const favorites = await get<string[]>(FAVORITES_KEY);
    return new Set(favorites || []);
}

// Save favorites to IndexedDB
async function saveFavorites(favorites: Set<string>): Promise<void> {
    await set(FAVORITES_KEY, Array.from(favorites));
}

// Fetch characters data
async function fetchCharacters(): Promise<Character[]> {
    const response = await fetch("https://swapi.dev/api/people/");
    const data = await response.json();
    return data.results;
}

// Character Card Component (Stateless)
function CharacterCard(props: {
    character: Character;
    isFavorite: boolean;
    onToggleFavorite: (characterId: string) => void;
    isUpdating: boolean;
    isDisabled: boolean;
}) {
    const { character, isFavorite, onToggleFavorite, isUpdating, isDisabled } = props;
    const characterId = getCharacterId(character.url);

    return (
        <div
            css={{
                padding: "1rem",
                border: isFavorite ? "3px solid #f39c12" : "2px solid #ddd",
                borderRadius: "8px",
                backgroundColor: isFavorite ? "#fff9e6" : "#fff",
                position: "relative",
                transition: "all 0.2s ease",
            }}
        >
            {isFavorite && (
                <div
                    css={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        fontSize: "1.5rem",
                    }}
                >
                    ⭐
                </div>
            )}
            <h3 css={{ marginTop: 0, marginBottom: "0.5rem" }}>{character.name}</h3>
            <div css={{ fontSize: "0.9em", color: "#666", marginBottom: "1rem" }}>
                <div>Height: {character.height}cm</div>
                <div>Mass: {character.mass}kg</div>
                <div>Birth Year: {character.birth_year}</div>
                <div>Gender: {character.gender}</div>
            </div>
            <button
                css={{
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    backgroundColor: isFavorite ? "#e74c3c" : "#f39c12",
                    color: "white",
                    border: "none",
                    cursor: isDisabled ? "wait" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                    fontWeight: 600,
                }}
                disabled={isDisabled}
                on={dom.click(() => onToggleFavorite(characterId))}
            >
                {isUpdating ? "Saving..." : isFavorite ? "❌ Remove Favorite" : "⭐ Add Favorite"}
            </button>
        </div>
    );
}

// Component that uses use() to load characters with Suspense
function CharactersList(
    this: Remix.Handle,
    props: {
        charactersPromise: Promise<Character[]>;
        onToggleFavorite: (characterId: string) => void;
        optimisticFavorites: Set<string>;
        updatingCharacterId: string | null;
        isSaving: boolean;
        favoritesReady: boolean;
    },
) {
    // Use the use() hook to suspend while loading
    const characters = use(this, props.charactersPromise);

    return () => {
        // throw new Error("Test Error")

        const {
            onToggleFavorite,
            optimisticFavorites,
            updatingCharacterId,
            isSaving,
            favoritesReady,
        } = props;
        const charactersList = characters();

        if (!charactersList) {
            return null;
        }

        return (
            <div
                css={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1rem",
                }}
            >
                {charactersList.map(character => {
                    const characterId = getCharacterId(character.url);
                    const isFavorite = optimisticFavorites.has(characterId);
                    const isThisCharacterUpdating = updatingCharacterId === characterId;
                    const isUpdating = isThisCharacterUpdating;
                    const isDisabled = !favoritesReady || isSaving || isThisCharacterUpdating;

                    return (
                        <CharacterCard
                            character={character}
                            isDisabled={isDisabled}
                            isFavorite={isFavorite}
                            isUpdating={isUpdating}
                            key={character.url}
                            onToggleFavorite={onToggleFavorite}
                        />
                    );
                })}
            </div>
        );
    };
}

export function StarWarsFavoritesDemo(this: Remix.Handle) {
    let charactersPromise: Promise<Character[]> | null = null;
    let hasStartedLoading = false;
    let updatingCharacterId: string | null = null;
    let hasLoadedFavorites = false;

    const [getServerFavorites, runFavoritesAction, isFavoritesPending] = useActionState<
        Set<string>,
        FavoritesAction
    >(
        this,
        async (state, action) => {
            if (action.type === "init") {
                hasLoadedFavorites = true;
                return new Set(action.favorites);
            }

            if (action.type === "toggle") {
                const next = new Set(state);

                if (next.has(action.characterId)) {
                    next.delete(action.characterId);
                } else {
                    next.add(action.characterId);
                }

                try {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await saveFavorites(next);
                    return next;
                } finally {
                    updatingCharacterId = null;
                }
            }

            return state;
        },
        new Set<string>(),
    );

    // Optimistic favorites state keyed off of the server favorites
    const [getOptimisticFavorites, setOptimisticFavorites] = useOptimistic(this, () =>
        getServerFavorites(),
    );

    // Load favorites from IndexedDB on mount
    loadFavorites()
        .then(favorites => {
            if (this.signal.aborted) return;
            void runFavoritesAction({ type: "init", favorites });
        })
        .catch(error => {
            console.error("Failed to load favorites", error);
        });

    // Start loading characters
    const startLoadingCharacters = () => {
        if (!hasStartedLoading) {
            hasStartedLoading = true;
            charactersPromise = fetchCharacters();
            this.update();
        }
    };

    // Handle favorite toggle with optimistic update and action state
    const handleToggleFavorite = (characterId: string) => {
        if (isFavoritesPending()) return;

        updatingCharacterId = characterId;

        const currentFavorites = getOptimisticFavorites();
        const newOptimisticFavorites = new Set(currentFavorites);

        if (newOptimisticFavorites.has(characterId)) {
            newOptimisticFavorites.delete(characterId);
        } else {
            newOptimisticFavorites.add(characterId);
        }

        setOptimisticFavorites(newOptimisticFavorites);

        void runFavoritesAction({ type: "toggle", characterId });
    };

    return () => {
        const optimisticFavorites = getOptimisticFavorites();
        const favoritesList = Array.from(optimisticFavorites);
        const isSaving = isFavoritesPending();
        const statusMessage = !hasLoadedFavorites
            ? "⏳ Loading favorites..."
            : isSaving
              ? "⏳ Saving..."
              : "✅ Synced";

        return (
            <div css={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
                <h2 css={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
                    Star Wars Favorites (use() + Suspense)
                </h2>
                <p css={{ marginBottom: "2rem", color: "#666" }}>
                    Click to load characters with <code>use()</code>. Favorites use{" "}
                    <code>useOptimistic</code> for instant UI updates! (Note: Wait for one operation
                    to complete before clicking another for best results)
                </p>

                {!hasStartedLoading && (
                    <button
                        css={{
                            padding: "1rem 2rem",
                            fontSize: "1.1rem",
                            borderRadius: "8px",
                            backgroundColor: "#4a9eff",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                        }}
                        on={dom.click(startLoadingCharacters)}
                    >
                        Load Characters with use()
                    </button>
                )}

                {hasStartedLoading && charactersPromise && (
                    <>
                        <div
                            css={{
                                marginBottom: "2rem",
                                padding: "1rem",
                                backgroundColor: "#e8f4f8",
                                borderRadius: "8px",
                                border: "2px solid #4a9eff",
                            }}
                        >
                            <h3 css={{ marginTop: 0 }}>Stats</h3>
                            <div css={{ display: "flex", gap: "2rem", fontSize: "1.1rem" }}>
                                <div>
                                    <strong>Favorites:</strong> {favoritesList.length}
                                </div>
                                <div>
                                    <strong>Status:</strong> {statusMessage}
                                </div>
                            </div>
                        </div>

                        <Suspense
                            fallback={
                                <div
                                    css={{
                                        textAlign: "center",
                                        padding: "4rem",
                                        fontSize: "1.2rem",
                                    }}
                                >
                                    <div css={{ marginBottom: "1rem" }}>
                                        🚀 Loading characters...
                                    </div>
                                    <div css={{ fontSize: "0.9rem", color: "#666" }}>
                                        (Powered by use() hook)
                                    </div>
                                </div>
                            }
                        >
                            <div>
                                <CharactersList
                                    charactersPromise={charactersPromise}
                                    favoritesReady={hasLoadedFavorites}
                                    isSaving={isSaving}
                                    onToggleFavorite={handleToggleFavorite}
                                    optimisticFavorites={optimisticFavorites}
                                    updatingCharacterId={updatingCharacterId}
                                />
                            </div>
                        </Suspense>
                    </>
                )}
            </div>
        );
    };
}
