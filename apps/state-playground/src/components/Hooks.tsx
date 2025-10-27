import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { Stack } from "@remix-run/library";
import {
    createStore,
    shallowEqArray,
    use,
    useActionState,
    useId,
    useMemo,
    useOptimistic,
    useReducer,
    useState,
} from "~/lib/hooks.ts";

// Demo 1: useState hook
function UseStateDemo(this: Remix.Handle) {
    const [count, setCount] = useState(this, 0);

    return () => (
        <div
            css={{
                padding: "1rem",
                border: "2px solid #4a9eff",
                borderRadius: "8px",
                marginBottom: "1rem",
            }}
        >
            <h3 css={{ marginTop: 0 }}>useState Demo</h3>
            <p>Count: {count()}</p>
            <div css={{ display: "flex", gap: "0.5rem" }}>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => setCount(count() + 1))}
                >
                    Increment
                </button>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => setCount(count() - 1))}
                >
                    Decrement
                </button>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => setCount(prev => (prev ?? 0) * 2))}
                >
                    Double
                </button>
            </div>
        </div>
    );
}

// Demo 2: useReducer hook
type CounterState = { count: number; lastAction: string };
type CounterAction = [action: "increment" | "decrement" | "reset"];

function UseReducerDemo(this: Remix.Handle) {
    const reducer = (state: CounterState, [action]: CounterAction): CounterState => {
        switch (action) {
            case "increment":
                return { count: state.count + 1, lastAction: "increment" };
            case "decrement":
                return { count: state.count - 1, lastAction: "decrement" };
            case "reset":
                return { count: 0, lastAction: "reset" };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(this, reducer, { count: 0, lastAction: "none" });

    return () => (
        <div
            css={{
                padding: "1rem",
                border: "2px solid #27ae60",
                borderRadius: "8px",
                marginBottom: "1rem",
            }}
        >
            <h3 css={{ marginTop: 0 }}>useReducer Demo</h3>
            <p>
                Count: {state().count} (Last Action: {state().lastAction})
            </p>
            <div css={{ display: "flex", gap: "0.5rem" }}>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => dispatch("increment"))}
                >
                    Increment
                </button>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => dispatch("decrement"))}
                >
                    Decrement
                </button>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => dispatch("reset"))}
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

// Demo 3: useMemo hook
function UseMemoDemo(this: Remix.Handle) {
    let firstName = "John";
    let lastName = "Doe";
    let renderCount = 0;
    let computationCount = 0;

    // Memoize the full name computation
    const getFullName = useMemo(shallowEqArray, ([first, last]: [string, string]) => {
        console.log("Heavy ccomputation to create the full name...");
        computationCount++;
        return `${first} ${last}`;
    });

    return () => {
        renderCount++;
        return (
            <div
                css={{
                    padding: "1rem",
                    border: "2px solid #e74c3c",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                }}
            >
                <h3 css={{ marginTop: 0 }}>useMemo Demo</h3>
                <p>Full Name: {getFullName([firstName.trim(), lastName.trim()])}</p>
                <p css={{ fontSize: "0.9em", color: "#666" }}>
                    Computation count: {computationCount}
                </p>
                <p css={{ fontSize: "0.9em", color: "#666" }}>Render count: {renderCount}</p>
                <div css={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                    <input
                        css={{ padding: "0.5rem", borderRadius: "4px" }}
                        on={dom.input(event => {
                            const shouldUpdate =
                                firstName.trim() !== event.currentTarget.value.trim();
                            firstName = event.currentTarget.value;
                            // if (shouldUpdate)
                            this.update();
                        })}
                        placeholder="First Name"
                        value={firstName}
                    />
                    <input
                        css={{ padding: "0.5rem", borderRadius: "4px" }}
                        on={dom.input(event => {
                            const shouldUpdate =
                                lastName.trim() !== event.currentTarget.value.trim();
                            lastName = event.currentTarget.value;
                            // if (shouldUpdate)
                            this.update();
                        })}
                        placeholder="Last Name"
                        value={lastName}
                    />
                </div>
            </div>
        );
    };
}

// Demo 4: use hook with Store
function UseStoreDemo(this: Remix.Handle) {
    const counterStore = createStore(0);
    const counter = use(this, counterStore);

    return () => (
        <div
            css={{
                padding: "1rem",
                border: "2px solid #9b59b6",
                borderRadius: "8px",
                marginBottom: "1rem",
            }}
        >
            <h3 css={{ marginTop: 0 }}>use(Store) Demo</h3>
            <p>Store Value: {counter()}</p>
            <div css={{ display: "flex", gap: "0.5rem" }}>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => counterStore.update(counter() + 1))}
                >
                    Increment Store
                </button>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => counterStore.update(counter() - 1))}
                >
                    Decrement Store
                </button>
            </div>
        </div>
    );
}

// Demo 5: useOptimistic hook
function UseOptimisticDemo(this: Remix.Handle) {
    let serverCount = 0;
    let showError = false;

    const [optimisticCount, setOptimisticCount] = useOptimistic(this, () => serverCount);

    const simulateServerUpdate = async (shouldFail: boolean) => {
        // Show optimistic update immediately
        const optimisticValue = optimisticCount() + 1;
        setOptimisticCount(optimisticValue);
        showError = false;

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (shouldFail) {
            // Simulate error - server rejects the update
            // Call this.update() to automatically reset the optimistic state
            showError = true;
            this.update();
        } else {
            // Success - server accepts the update
            serverCount = optimisticValue;
            this.update();
        }
    };

    return () => (
        <div
            css={{
                padding: "1rem",
                border: "2px solid #f39c12",
                borderRadius: "8px",
                marginBottom: "1rem",
            }}
        >
            <h3 css={{ marginTop: 0 }}>useOptimistic Demo</h3>
            <p>Server Count: {serverCount}</p>
            <p>Optimistic Count: {optimisticCount()}</p>
            {showError && (
                <p css={{ color: "#e74c3c", fontSize: "0.9em", fontWeight: 600 }}>
                    ❌ Server rejected! Optimistic state auto-reset via this.update().
                </p>
            )}
            <p css={{ fontSize: "0.9em", color: "#666" }}>
                Optimistic updates automatically clear when you call this.update() after your async
                operation completes (success or failure).
            </p>
            <div css={{ display: "flex", gap: "0.5rem" }}>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    on={dom.click(() => simulateServerUpdate(false))}
                >
                    Increment (Success)
                </button>
                <button
                    css={{
                        padding: "0.5rem 1rem",
                        borderRadius: "4px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        border: "none",
                    }}
                    on={dom.click(() => simulateServerUpdate(true))}
                >
                    Increment (Fail)
                </button>
            </div>
        </div>
    );
}

// Demo 6: useActionState hook
function UseActionStateDemo(this: Remix.Handle) {
    const incrementAction = async (state: number, amount: number) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));
        return state + amount;
    };

    const [count, increment, isPending] = useActionState(this, incrementAction, 0);

    return () => (
        <div
            css={{
                padding: "1rem",
                border: "2px solid #1abc9c",
                borderRadius: "8px",
                marginBottom: "1rem",
            }}
        >
            <h3 css={{ marginTop: 0 }}>useActionState Demo</h3>
            <p>Count: {count()}</p>
            <p css={{ fontSize: "0.9em", color: "#666" }}>
                Status: {isPending() ? "Pending..." : "Ready"}
            </p>
            <div css={{ display: "flex", gap: "0.5rem" }}>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    disabled={isPending()}
                    on={dom.click(() => increment(1))}
                >
                    +1
                </button>
                <button
                    css={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
                    disabled={isPending()}
                    on={dom.click(() => increment(5))}
                >
                    +5
                </button>
            </div>
        </div>
    );
}

// Demo 7: useId hook
function UseIdDemo(this: Remix.Handle) {
    const emailId = useId();
    const passwordId = useId();

    return () => (
        <div
            css={{
                padding: "1rem",
                border: "2px solid #34495e",
                borderRadius: "8px",
                marginBottom: "1rem",
            }}
        >
            <h3 css={{ marginTop: 0 }}>useId Demo</h3>
            <p css={{ fontSize: "0.9em", color: "#666" }}>
                IDs are stable across renders and unique per component instance
            </p>
            <div css={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>
                    <label css={{ display: "block", marginBottom: "0.25rem" }} for={emailId}>
                        Email:
                    </label>
                    <input
                        css={{ padding: "0.5rem", borderRadius: "4px", width: "100%" }}
                        id={emailId}
                        placeholder="Enter email"
                        type="email"
                    />
                </div>
                <div>
                    <label css={{ display: "block", marginBottom: "0.25rem" }} for={passwordId}>
                        Password:
                    </label>
                    <input
                        css={{ padding: "0.5rem", borderRadius: "4px", width: "100%" }}
                        id={passwordId}
                        placeholder="Enter password"
                        type="password"
                    />
                </div>
            </div>
        </div>
    );
}

export function HooksDemo() {
    return (
        <Stack css={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1 css={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
                React-like Hooks for Remix 3
            </h1>
            <UseStateDemo />
            <UseReducerDemo />
            <UseMemoDemo />
            <UseStoreDemo />
            <UseOptimisticDemo />
            <UseActionStateDemo />
            <UseIdDemo />
        </Stack>
    );
}
