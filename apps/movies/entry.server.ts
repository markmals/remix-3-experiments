import { router } from "./app/router.ts";

export default {
	async fetch(request: Request): Promise<Response> {
		try {
			return await router.fetch(request);
		} catch (error) {
			console.error(error);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};

if (import.meta.hot) {
	import.meta.hot.accept();
}
