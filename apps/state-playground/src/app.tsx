import type { Remix } from "@remix-run/dom";
import { Stack } from "@remix-run/library";
import { AlienObservableDemo } from "./components/AlienObservable.tsx";
import { AsyncGeneratorExample } from "./components/AsyncGenerator.tsx";
import { HooksDemo } from "./components/Hooks.tsx";
import { StarWarsFavoritesDemo } from "./components/StarWarsFavorites.tsx";
import { ZustandExample } from "./components/Zustand.tsx";

export function App(this: Remix.Handle) {
    return () => (
        <Stack css={{ padding: "2rem" }}>
            <h1 css={{ fontSize: "32px", fontWeight: 700, marginBottom: "1rem" }}>
                Star Wars Favorites (useOptimistic + useActionState + IndexedDB)
            </h1>
            <StarWarsFavoritesDemo />
            <h1 css={{ fontSize: "32px", fontWeight: 700, marginBottom: "1rem" }}>
                React-like Hooks
            </h1>
            <HooksDemo />
            <h1 css={{ fontSize: "32px", fontWeight: 700, marginBottom: "1rem" }}>Zustand</h1>
            <ZustandExample />
            <h1 css={{ fontSize: "32px", fontWeight: 700, marginBottom: "1rem" }}>
                Async Generator
            </h1>
            <AsyncGeneratorExample />
            <h1 css={{ fontSize: "32px", fontWeight: 700, marginBottom: "1rem" }}>Alien Signals</h1>
            <AlienObservableDemo />
        </Stack>
    );
}
