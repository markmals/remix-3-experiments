import type { ClientRouteHandlers } from "remix-client-router";
import { Counter } from "./components/Counter.tsx";
import { createPost, getPost, getPosts } from "./lib/posts.ts";
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
        async index({ storage }) {
            const posts = await getPosts(storage);

            return (
                <>
                    <h1>Blog</h1>
                    <ul>
                        {posts.map(post => (
                            <li>
                                <a href={routes.blog.show.href({ id: post.id.toString() })}>
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
        async show({ params, storage }) {
            const { title, content } = await getPost(Number(params.id), storage);

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
        async create({ formData, storage }) {
            // TypeScript knows formData is available because the route method is POST!
            // No guard needed - formData is guaranteed to exist!
            const title = formData.get("title") as string;
            const content = formData.get("content") as string;

            // Create and persist the post using AppStorage
            const newPost = await createPost(title, content, storage);
            console.log("Created post:", newPost);

            // Show success message with link to view the new post
            return (
                <>
                    <h1>Post Created!</h1>
                    <p>Title: {newPost.title}</p>
                    <p>Content: {newPost.content}</p>
                    <p>
                        <a href={routes.blog.show.href({ id: newPost.id.toString() })}>View Post</a>
                        {" | "}
                        <a href={routes.blog.index.href()}>Back to Blog</a>
                    </p>
                </>
            );
        },
    },
} satisfies ClientRouteHandlers<typeof routes>;
