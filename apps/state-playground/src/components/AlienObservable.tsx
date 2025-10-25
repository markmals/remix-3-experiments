import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import {
	component,
	observable,
	withObservationTracking,
} from "../lib/alien-observable.ts";

// Example 1: Simple counter with @observable state
@observable()
class Counter {
	count = 0;

	increment() {
		this.count++;
	}

	decrement() {
		this.count--;
	}

	get double() {
		return this.count * 2;
	}
}

const CounterDemo = component(() => {
	const counter = new Counter();

	return () => (
		<div
			css={{
				padding: "24px",
				border: "1px solid #ccc",
				borderRadius: "8px",
				marginBottom: "16px",
			}}
		>
			<div
				css={{
					fontSize: "24px",
					margin: "16px 0",
				}}
			>
				Count: {counter.count}
			</div>
			<div
				css={{
					fontSize: "18px",
					color: "#666",
					marginBottom: "16px",
				}}
			>
				Double: {counter.double}
			</div>
			<div css={{ display: "flex", gap: "8px" }}>
				<button
					type="button"
					on={dom.click(() => counter.decrement())}
					css={{
						padding: "8px 16px",
						fontSize: "16px",
						cursor: "pointer",
					}}
				>
					-
				</button>
				<button
					type="button"
					on={dom.click(() => counter.increment())}
					css={{
						padding: "8px 16px",
						fontSize: "16px",
						cursor: "pointer",
					}}
				>
					+
				</button>
			</div>
		</div>
	);
});

// Example 2: Component with observable props
const DisplayValue = component<{ value: number }>((props) => {
	// Track prop changes in setup phase
	let changeCount = 0;

	withObservationTracking(() => {
		// This runs whenever props.value changes
		console.log("DisplayValue: value changed to", props.value);
		changeCount++;
	});

	return () => (
		<div
			css={{
				padding: "16px",
				background: "#f0f0f0",
				borderRadius: "4px",
			}}
		>
			<div>Current value: {props.value}</div>
			<div css={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
				Changed {changeCount} times
			</div>
		</div>
	);
});

const PropsDemo = component(() => {
	const counter = new Counter();

	return () => (
		<div
			css={{
				padding: "24px",
				border: "1px solid #ccc",
				borderRadius: "8px",
				marginBottom: "16px",
			}}
		>
			<h3>
				Observable Props with <code>withObservationTracking</code>
			</h3>
			<div css={{ marginBottom: "16px" }}>
				<button
					type="button"
					on={dom.click(() => counter.increment())}
					css={{
						padding: "8px 16px",
						fontSize: "16px",
						cursor: "pointer",
					}}
				>
					Increment
				</button>
			</div>
			<DisplayValue value={counter.count} />
		</div>
	);
});

// Example 3: Todo list with @observable state
@observable()
class Todo {
	completed = false;
	id = Math.random().toString(36).slice(2);

	constructor(public text: string) {}

	toggle() {
		this.completed = !this.completed;
	}
}

@observable()
class TodoStore {
	todos: Todo[] = [];
	newTodoText = "";

	addTodo() {
		if (this.newTodoText.trim()) {
			this.todos.push(new Todo(this.newTodoText));
			this.newTodoText = "";
		}
	}

	get completedCount() {
		return this.todos.filter((t) => t.completed).length;
	}

	get totalCount() {
		return this.todos.length;
	}
}

const TodoDemo = component(() => {
	const store = new TodoStore();

	return () => (
		<div
			css={{
				padding: "24px",
				border: "1px solid #ccc",
				borderRadius: "8px",
			}}
		>
			<h3>Todo List</h3>

			<div css={{ marginBottom: "16px" }}>
				<input
					type="text"
					value={store.newTodoText}
					placeholder="What needs to be done?"
					on={[
						dom.input((event) => {
							store.newTodoText = event.currentTarget.value;
						}),
						dom.keydown((event) => {
							if (event.key === "Enter") {
								store.addTodo();
							}
						}),
					]}
					css={{
						padding: "8px",
						fontSize: "16px",
						width: "300px",
						marginRight: "8px",
					}}
				/>
				<button
					type="button"
					on={dom.click(() => store.addTodo())}
					css={{
						padding: "8px 16px",
						fontSize: "16px",
						cursor: "pointer",
					}}
				>
					Add
				</button>
			</div>

			<div css={{ marginBottom: "16px" }}>
				{store.todos.map((todo) => (
					<div
						key={todo.id}
						css={{
							padding: "8px",
							background: todo.completed ? "#e8f5e9" : "#fff",
							borderBottom: "1px solid #eee",
							display: "flex",
							alignItems: "center",
							gap: "8px",
						}}
					>
						<input
							type="checkbox"
							checked={todo.completed}
							on={dom.change(() => todo.toggle())}
						/>
						<span
							css={{
								textDecoration: todo.completed ? "line-through" : "none",
								color: todo.completed ? "#666" : "#000",
							}}
						>
							{todo.text}
						</span>
					</div>
				))}
			</div>

			<div css={{ fontSize: "14px", color: "#666" }}>
				{store.completedCount} / {store.totalCount} completed
			</div>
		</div>
	);
});

// Main export
export function AlienObservableDemo(this: Remix.Handle) {
	return () => (
		<div css={{ padding: "24px" }}>
			<p css={{ marginBottom: "32px", color: "#666" }}>
				Demonstrating fine-grained reactivity with alien-signals and TC-39{" "}
				<code>@observable()</code> decorators
			</p>

			<CounterDemo />
			<PropsDemo />
			<TodoDemo />
		</div>
	);
}
