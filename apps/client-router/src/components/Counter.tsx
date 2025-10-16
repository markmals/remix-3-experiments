import type { Remix } from "@remix-run/dom";
import { press } from "@remix-run/events/press";

export function Counter(this: Remix.Handle) {
	let count = 1;
	const double = () => count * 2;

	const inc = press(() => {
		count += 1;
		this.update();
	});

	return () => (
		<div>
			<span>
				Double {count} is {double()}
			</span>
			<br />
			<button type="button" on={inc}>
				Increment
			</button>
		</div>
	);
}
