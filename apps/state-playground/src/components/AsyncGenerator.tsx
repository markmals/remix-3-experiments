import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { combineLatest, component, Store } from "~/lib/async.ts";

interface Item {
    id: number;
    name: string;
    category: "fruit" | "vegetable" | "other";
}

interface FilterProps {
    filterText: string;
    category: string;
}

interface ItemState {
    items: Item[];
    lastAdded: number | null;
}

class ItemStore extends Store<ItemState> {
    addItem(name: string, category: Item["category"]) {
        const newId = Math.max(0, ...this.current.items.map((item: Item) => item.id)) + 1;
        this.next({
            items: [...this.current.items, { id: newId, name, category }],
            lastAdded: newId,
        });
    }

    removeItem(id: number) {
        this.next({
            items: this.current.items.filter((item: Item) => item.id !== id),
        });
    }
}

// TODO: Component decorator
// @component()
// async function *ItemDisplay(this: Component.Handle<FilterProps>) {
// 	const store = new ItemStore({
// 		items: [
// 			{ id: 1, name: "Apple", category: "fruit" },
// 			{ id: 2, name: "Banana", category: "fruit" },
// 			{ id: 3, name: "Carrot", category: "vegetable" },
// 			{ id: 4, name: "Date", category: "fruit" },
// 			{ id: 5, name: "Egg", category: "other" },
// 		],
// 		lastAdded: null,
// 	});

// 		// Demonstrate loading state on initial render
// 	yield <div>Loading...</div>;
// 	await new Promise((r) => setTimeout(r, 500));

// 	const state = combineLatest(this, store);

// 	for await (const [{ filterText, category }, { items }] of state) {
// 		yield <div>{items.map(item => <>{item.name}</>)}</div>
// 	}
// }

const ItemDisplay = component<FilterProps>(async function* (props) {
    const categories = ["fruit", "vegetable", "other"] satisfies Item["category"][];

    const store = new ItemStore({
        items: [
            { id: 1, name: "Apple", category: "fruit" },
            { id: 2, name: "Banana", category: "fruit" },
            { id: 3, name: "Carrot", category: "vegetable" },
            { id: 4, name: "Date", category: "fruit" },
            { id: 5, name: "Egg", category: "other" },
        ],
        lastAdded: null,
    });

    // Demonstrate loading state on initial render
    yield <div>Loading...</div>;
    await new Promise(r => setTimeout(r, 500));

    const state = combineLatest(props, store);

    for await (const [{ filterText, category }, { items }] of state) {
        // yield <div>Processing...</div>;
        // await new Promise((r) => setTimeout(r, 1000));

        const filteredItems = items.filter(item => {
            const matchesText =
                !filterText || item.name.toLowerCase().includes(filterText.toLowerCase());
            const matchesCategory = !category || item.category === category;
            return matchesText && matchesCategory;
        });

        const totalCount = items.length;
        const filteredCount = filteredItems.length;

        yield (
            <item-display>
                <div css={{ marginBottom: "20px" }}>
                    <h4>Add Item:</h4>
                    <form
                        on={dom.submit(event => {
                            event.preventDefault();
                            const form = event.currentTarget;
                            const formData = new FormData(form);
                            const name = formData.get("name") as string;
                            const category = formData.get("category") as Item["category"];
                            if (name && category) {
                                store.addItem(name, category);
                                form.reset();
                            }
                        })}
                    >
                        <input
                            css={{ marginRight: "8px", padding: "4px" }}
                            name="name"
                            placeholder="Item name"
                            type="text"
                        />
                        <select css={{ marginRight: "8px", padding: "4px" }} name="category">
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <button type="submit">Add</button>
                    </form>
                </div>

                <div
                    css={{
                        marginBottom: "20px",
                        padding: "10px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                    }}
                >
                    <h4>Statistics:</h4>
                    <div>Total items: {totalCount}</div>
                    <div>Filtered items: {filteredCount}</div>
                    <div>Categories: {categories.join(", ")}</div>
                </div>

                <div>
                    <h4>Filtered Items:</h4>
                    {filteredItems.length === 0 ? (
                        <p>No items match the current filters</p>
                    ) : (
                        <ul>
                            {filteredItems.map(item => (
                                <li
                                    css={{
                                        marginBottom: "8px",
                                        padding: "8px",
                                        backgroundColor: "white",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                    key={item.id}
                                >
                                    <strong>{item.name}</strong> ({item.category})
                                    <button
                                        css={{
                                            marginLeft: "10px",
                                            padding: "2px 8px",
                                            fontSize: "12px",
                                        }}
                                        on={dom.click(() => store.removeItem(item.id))}
                                        type="button"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </item-display>
        );
    }
});

// Parent component that controls the props
export function AsyncGeneratorExample(this: Remix.Handle) {
    let filterText = "";
    let category = "";

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
                <div css={{ marginBottom: "10px" }}>
                    <label css={{ display: "block", marginBottom: "4px" }} for="filter-text">
                        <strong>Filter Text:</strong>
                    </label>
                    <input
                        css={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "14px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                        id="filter-text"
                        on={dom.input(event => {
                            filterText = event.currentTarget.value;
                            this.update();
                        })}
                        placeholder="Filter by name..."
                        type="text"
                        value={filterText}
                    />
                </div>
                <div>
                    <label css={{ display: "block", marginBottom: "4px" }} for="filter-category">
                        <strong>Filter Category:</strong>
                    </label>
                    <select
                        css={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "14px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                        id="filter-category"
                        on={dom.change(event => {
                            category = event.currentTarget.value;
                            this.update();
                        })}
                        value={category}
                    >
                        <option value="">All Categories</option>
                        <option value="fruit">Fruit</option>
                        <option value="vegetable">Vegetable</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <ItemDisplay category={category} filterText={filterText} />
        </async-generator-example>
    );
}
