import { createEventType } from "@remix-run/events";

export class ValueObserver<Value> extends EventTarget {
	#previous: Value;
	#createValueChange;

	change;

	constructor(initialValue: Value) {
		super();

		const [valueChanged, createValueChange] =
			createEventType<Value>("rmx:props-change");
		this.change = valueChanged;
		this.#createValueChange = createValueChange;

		this.#previous = initialValue;
	}

	next(value: Value) {
		if (value !== this.#previous) {
			this.#previous = value;
			this.dispatchEvent(this.#createValueChange({ detail: value }));
		}
	}
}
