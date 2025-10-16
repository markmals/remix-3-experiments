import type { ClientRouteHandlers } from "../router/types.ts";
import { Counter } from "./components/Counter.tsx";
import { getPost, getPosts } from "./lib/posts.ts";
import { routes } from "./routes.ts";

export const handlers = {
	async index() {
		return (
			<div>
				<h1>Hello, World!</h1>
				<Counter />
			</div>
		);
	},
	async about() {
		return <h1>Hi! I'm Mark.</h1>;
	},
	blog: {
		async index() {
			const posts = await getPosts();

			return (
				<>
					<h1>Blog</h1>
					<ul>
						{posts.map((post) => (
							<li>
								<a href={routes.blog.show.href({ id: post.id })}>
									{post.title}
								</a>
							</li>
						))}
					</ul>
					<p>
						<a href={routes.blog.new.href()}>Create New Post</a>
					</p>
				</>
			);
		},
		async show({ params }) {
			const { title, content } = await getPost(Number(params.id));

			return (
				<>
					<h1>{title}</h1>
					<p>{content}</p>
					<p>
						<a href={routes.blog.index.href()}>Back to Blog</a>
					</p>
				</>
			);
		},
		async new() {
			return (
				<>
					<h1>Create New Post</h1>
					<form method="POST" action={routes.blog.create.href()}>
						<div>
							<label>
								Title:
								<input type="text" name="title" required />
							</label>
						</div>
						<div>
							<label>
								Content:
								<textarea name="content" required />
							</label>
						</div>
						<button type="submit">Create Post</button>
					</form>
					<p>
						<a href={routes.blog.index.href()}>Cancel</a>
					</p>
				</>
			);
		},
		async create({ formData }) {
			// TypeScript knows formData is available because the route method is POST!
			// No guard needed - formData is guaranteed to exist!
			const title = formData.get("title") as string;
			const content = formData.get("content") as string;

			// In a real app, you'd save this to a database
			console.log("Creating post:", { title, content });

			// Redirect back to blog index
			// For now, just show a success message
			return (
				<>
					<h1>Post Created!</h1>
					<p>Title: {title}</p>
					<p>Content: {content}</p>
					<p>
						<a href={routes.blog.index.href()}>Back to Blog</a>
					</p>
				</>
			);
		},
	},
} satisfies ClientRouteHandlers<typeof routes>;
