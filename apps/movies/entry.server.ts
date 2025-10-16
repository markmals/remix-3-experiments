import { router as initialRouter } from "./app/router.ts";

let currentRouter = initialRouter;

export default {
	async fetch(request: Request): Promise<Response> {
		try {
			return await currentRouter.fetch(request);
		} catch (error) {
			console.error(error);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};

if (import.meta.hot) {
	import.meta.hot.accept("./app/router.ts", async (newModule) => {
		if (newModule?.router) {
			currentRouter = newModule.router;
			console.log("[HMR] Router updated");
		}
	});
}
