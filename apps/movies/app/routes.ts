import { resources, route } from "@remix-run/fetch-router";

export const routes = route({
	index: "/", // would show what movies.index would theoretically show
	movies: resources("/movies", {
		only: ["show"],
	}),

	tv: resources("/tv", {
		only: ["index", "show"],
	}),

	people: resources("/people", {
		only: ["index", "show"],
	}),

	about: "/about",

	// Fragment routes for client-side navigation
	fragments: route("/fragments", {
		movieList: "/movie-list",
		movieDetails: "/movie-details/:id",
	}),

	// Assets for hydrated components
	assets: "/assets/*path",
});
