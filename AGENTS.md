# Contributor Guide

This project is a monorepo of experiments for the pre-alpha preview release of Remix 3. Remix 3 is not related in any way to the previous versions of Remix nor React Router; they are just created by the same team.

## Eventing

Remix 3 starts from events as its first principles since events are extraordinarily fundamental to interactive user interfaces on the web. To compliment these first principles, Remix 3 includes the `@remix-run/events` package, which provides a type-safe abstraction on top of DOM events and event composition.

Now instead of doing this:

```ts
const button = document.createElement("button");

let tempo = 0;

const handleTap = () => {
    // update average tempo
    button.textContent = tempo;
};

// Handle click events
button.addEventListener("pointerdown", handleTap);
// Handle keyboard events
button.addEventListener("keydown", event => {
    if (event.repeat) return;
    if (event.key === "Enter" || event.key === " ") {
        handleTap();
    }
});
```

You can simply do this:

```ts
import { events, dom } from "@remix-run/events";

const button = document.createElement("button");

let tempo = 0;

const handleTap = () => {
    // update average tempo
    button.textContent = tempo;
};

events(button, [
    dom.pointerdown(handleTap),
    dom.keydown(event => {
        if (event.repeat) return;
        if (event.key === "Enter" || event.key === " ") {
            handleTap();
        }
    }),
]);
```

The `dom` object includes type-safe event properties for DOM nodes. There is also a `win` object available from `@remix-run/events` which includes type-safe event properties for the global `window` object.

The example above can be farther simplified with some composed events shipped along with `@remix-run/events`, like so:

```ts
import { events, dom } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";

const button = document.createElement("button");

let tempo = 0;

const handleTap = () => {
    // update average tempo
    button.textContent = tempo;
};

events(button, [pressDown(handleTap)]);
```

`@remix-run/events` also includes an encapsulation and composition mechanism for creating your own type-safe events:

```ts
import { createInteraction, events } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";

// a 1-indexed range
function range(end: number) {
    return Array.from({ length: end }, (_, i) => i + 1);
}

export const tempo = createInteraction<HTMLButtonElement, number>(
    "rmx:tempo", // custom event name
    ({ target, dispatch }) => {
        let taps: number[] = [];
        let timerHandle;

        function handleTap() {
            clearTimeout(timerHandle);

            taps.push(new Date());
            taps = taps.filter(tap => Date.now() - tap > 4000);

            if (taps.length >= 4) {
                let intervals: Date[] = [];

                for (const i of range(taps.length)) {
                    intervals.push(taps[i] - taps[i - 1]);
                }

                let bpm = intervals.map(i => 60000 / i);
                let avgTempo = Math.round(bpm.reduce((sum, value) => sum + value, 0) / bpm.length);

                // `dispatch` takes a CustomEventInit generic over the second generic
                // argument for `createInteraction`; in this case CustomEventInit<number>
                dispatch({ detail: avgTempo });

                timerHandle = setTimeout(() => {
                    taps = [];
                }, 4000);
            }
        }

        return events(target, [pressDown(handleTap)]);
    }
);
```

This can then be used like so:

```ts
import { events } from "@remix-run/events";
import { tempo } from "./events.ts";

const button = document.createElement("button");

events(button, [
    tempo(event => {
        button.textContent = event.detail;
    }),
]);
```

If you have an `EventTarget` class that you want to include type-safe events with, a good practice is to assign them as static properties on the class itself so they can be used like so:

```ts
const [change, createChange] = createEventType("drum:change");
const [kick, createKick] = createEventType("drum:kick");
const [snare, createSnare] = createEventType("drum:snare");
const [hat, createHat] = createEventType("drum:hat");

class Drummer extends EventTarget {
    static change = change;
    static kick = kick;
    static snare = snare;
    static hat = hat;

    // ...

    someFunc() {
        someState += 1;
        this.dispatchEvent(createChange());
    }
}

// Later in a component:

const drummer = new Drummer({ bpm: 120 });
events(drummer, [Drummer.change(() => this.update())]);
```

This pattern is a handy way to propagate change/update management from custom state to your components.

### Key Events

The subfolder `@remix-run/events/key` provides a set of semantic keyboard events which can be used instead of the default `dom/win.keydown()` events.

```ts
import { events } from "@remix-run/events";
import { space, arrowUp, arrowDown } from "@remix-run/events/key";

events(window, [
    space(() => {
        // handle space press on the window
    }),
    arrowUp(() => {
        // handle arrow up press on the window
    }),
    arrowDown(() => {
        // handle arrow down press on the window
    }),
]);
```

### Cleanup

`event()` returns a cleanup function which can be used to remove event listeners when no longer needed.

```ts
const cleanup = events(button, [
    pressDown(() => {
        // ...
    }),
]);

// Later
cleanup();
```

## Components

Remix 3 uses JSX/TSX with the standard JSX transform and a custom virtual DOM reconciler which can handle diffing both client-side vDOM trees as well as HTML fragments received from the server. This is an example of a simple counter component in Remix 3:

```tsx
import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";

function Counter(this: Remix.Handle) {
    let count = 1;

    return () => (
        <>
            <div>
                Double {count} is {count * 2}
            </div>
            <button
                on={dom.click(() => {
                    count += 1;
                    this.update();
                })}
            >
                Increment
            </button>
        </>
    );
}
```

Like above, you can use the type-safe event composition layer in your declarative components as well. Every JSX element has an `on` prop which can be passed type-safe event handler or an array of type-safe event handlers.

Your component function (similar to a setup script in Vue or class constructor in Lit) is run once on component creation and from this component function you return a render function which itself returns a vDOM tree. The `this` argument to the component function is a handle to the internal component instance on which you can call `this.update()` (similar to `this.requestUpdate()` in Lit). When `this.update()` is called, the render function is re-run and the resulting vDOM tree is diffed with the previous tree and necessary resulting updates are made directly to the DOM.

### Props

Props can be passed to the component function as an optional second argument (after the `this` argument) in addition to being passed to the render function as an optional first argument:

```tsx
import type { Remix } from "@remix-run/dom";

type CartButtonProps = { inCart: boolean; id: string; slug: string };

function CartButton(this: Remix.Handle, props: CartButtonProps) {
    // do something in the component function with `props`

    return (props: CartButtonProps) => (
        // do something in the render function with `props`
        <form>
            <input type="hidden" name="bookId" value={props.id} />
            <input type="hidden" name="slug" value={props.slug} />
            <input type="hidden" name="redirect" value="none" />
            <button type="submit">{props.inCart ? "Remove from Cart" : "Add to Cart"}</button>
        </form>
    );
}
```

### State Management

Since the only action necessary to re-render your component is to call `this.update()`, there is no need for a built-in state management solution for Remix 3. You can declare plain JavaScript variables in your component function, read them in your render function, mutate them and call `this.update()` in your event handlers, and everything should update. However, you will need to be careful about under-updating (forgetting to call `this.update()` when you need to) with this method.

Derived state can be accomplished by using simple closures or declaring derived state in the render function:

```tsx
import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";

// simple closures
function Counter(this: Remix.Handle) {
    let count = 1;
    const double = () => count * 2;

    const increment = () => {
        count += 1;
        this.update();
    };

    return () => (
        <>
            <div>
                Double {count} is {double()}
            </div>
            <button on={dom.click(increment)}>Increment</button>
        </>
    );
}

// declaring derived state in the render function
function Counter(this: Remix.Handle) {
    let count = 1;

    const increment = () => {
        count += 1;
        this.update();
    };

    return () => {
        const double = count * 2;

        return (
            <>
                <div>
                    Double {count} is {double}
                </div>
                <button on={dom.click(increment)}>Increment</button>
            </>
        );
    };
}

// declaring derived state (inline) in the render function
function Counter(this: Remix.Handle) {
    let count = 1;

    const increment = () => {
        count += 1;
        this.update();
    };

    return () => (
        <>
            <div>
                Double {count} is {count * 2}
            </div>
            <button on={dom.click(increment)}>Increment</button>
        </>
    );
}
```

### Events

It's a good idea to attach any custom events to your component function as static properties (similarly to how we attached custom type-safe events as static properties to the `EventTarget` subclass), using this pattern:

```tsx
const [change, createChange] = createEventType<{ value: string }>("listbox:change");
// -OR-
export const change = createInteraction<HTMLSelectElement, { value: string }>(
    "listbox:change",
    ({ target, dispatch }) => {
        // ...
    }
);

function Listbox(
    this: Remix.Handle,
    props: {
        name: string;
        on?: EventDescriptor<HTMLSelectElement> | EventDescriptor<HTMLSelectElement>[];
    }
) {
    // ...
}

Listbox.change = change;

// Later...

<Listbox
    name="fruit"
    on={Listbox.change(event => {
        listboxValue = event.detail.value;
        this.update();
    })}
>
    <Option value="apple">Apple</Option>
    <Option value="banana">Banana</Option>
    <Option value="cherry"> Cherry</Option>
</Listbox>;
```

### Styling

Every Remix 3 component includes a `css` prop, which can be passed the standard CSS-in-JS object format for CSS, including descender selectors and other complicated selectors. The `css` props for every element in the rendered tree are collected at runtime, either during server rendering or client rendering, hashed into class names and rulesets, and placed into a global stylesheet in the `<head>` of the current document (or sometimes in `document.adoptedStyleSheets` — I'm not entirely clear on the implementation here and when which method is used). This allows you to co-locate your styles with your component, in a type-safe way, without using stringy class names or complicated build tooling set-ups.

Here is an example of the `css` prop in action:

```tsx
<form
    css={{
        margin: "24px",
        display: "flex",
        gap: "16px",
        "& label": {
            display: "block",
            marginBottom: "4px",
        },
    }}
>
    {/* ... */}
</form>
```

Eventually, Remix 3 will also include a bespoke component library (`@remix-run/library`) similar to `shadcn/ui` and a theming system (`@remix-run/theme`) to go along with it — based on CSS custom properties — but those features are not available in this preview.

### Imperative DOM References

Occasionally you may need an imperative reference to the DOM node being rendered by an element in your declarative template. To manage these references, you can use the `connect()` and `disconnect()` events:

```tsx
import type { Remix } from "@remix-run/dom";
import { connect, disconnect } from "@remix-run/dom";
import { dom } from "@remix-run/events";

function Counter(this: Remix.Handle) {
    let count = 1;
    let incButton: HTMLButtonElement;
    let decButton: HTMLButtonElement;

    const increment = () => {
        count += 1;
        this.update();
        this.queueTask(() => {
            decButton?.focus();
        });
    };

    const decrement = () => {
        count -= 1;
        this.update();
        this.queueTask(() => {
            incButton?.focus();
        });
    };

    return () => (
        <>
            <div>
                Double {count} is {count * 2}
            </div>
            <button
                on={[connect(event => (incButton = event.currentTarget)), dom.click(increment)]}
            >
                Increment
            </button>
            <button
                on={[connect(event => (decButton = event.currentTarget)), dom.click(decrement)]}
            >
                Decrement
            </button>
        </>
    );
}
```

### Context

Context is type-safe via the generic argument on `Remix.Handle<Value>`. It can be accessed via `this.context.get(Component)` and set via `this.context.set(value)`.

```tsx
import type { Remix } from "@remix-run/dom";
import { Drummer } from "./drummer.ts";

function App(this: Remix.Handle<Drummer>) {
    const drummer = new Drummer({ bpm: 120 });
    this.context.set(drummer);

    () => <>{/* ... */}</>;
}

function DrumControls(this: Remix.Handle) {
    const drummer = this.context.get(App);
    events(drummer, [Drummer.change(() => this.update())]);

    () => <>{/* ... */}</>;
}
```

### Abort Signals

As a rule, any time you hand a closure to Remix 3, it will pass an `AbortSignal` into that closure as the last argument so that you're able to know when to bail out (on re-renders or parent cancellation or what have you).

```tsx
<select
    on={dom.change(async (event, signal) => {
        fetchState = "loading";
        this.update();

        const response = await fetch(`*/api/data?state=${event.currentTarget.value}`, { signal });
        cities = await response.json();
        if (signal.aborted) return;

        fetchState = "loaded";
        this.update();
    })}
/>
```

### Stateless Components

Stateless components can be functions which return JSX. They don't need to return a function which returns JSX is there is no state associated with that particular component.

```tsx
export function App() {
    return (
        <Layout>
            <Equalizer />
            <DrumControls />
        </Layout>
    );
}
```

### Client Entry

To create a client-side Remix app, you simply:

```tsx
import { createRoot } from "@remix-run/dom";
import { App } from "./app.tsx";

createRoot(document.body).render(<App />);
```

### Render Batching

Remix 3 batches it's renders into a microtask queue in order to de-duplicate renders. If you need to do some work after the render batch has flushed, you can use the `this.queueTask()` API on `Remix.Handle`.

```tsx
function TempoDisplay(this: Remix.Handle) {
    return () => (
        <button
            on={pressDown(() => {
                this.queueTask(() => {
                    // Do work after the next `this.update()` is called
                    // and rendering has completed
                });
            })}
        >
            Play
        </button>
    );
}
```

### Component Cleanup

When a stateful component is unmounted from the vDOM tree, it's `this.signal` (an `AbortSignal`) is aborted, so you can use `this.signal` to manage cleanup in components.

```tsx
function App(this: Remix.Handle) {
    let drummer = new Drummer(120);
    events(this.signal, [dom.abort(drummer.stop)]);

    return () => <>{/* ... */}</>;
}
```

## Routing

Remix 3 is entirely server-routed in this preview release (though a client router is in the works). This means that every navigation or form submission will cause a full page reload for now.

The routes are set up using code and not file-system routing:

```ts
import type { RouteHandlers } from "@remix-run/fetch-router";
import { createRouter, route } from "@remix-run/fetch-router";
import { logger } from "@remix-run/fetch-router/logger-middleware";

const routes = route({
    home: "/",
    blog: {
        index: "/blog",
        post: "/blog/:id",
    },
});

const handlers = {
    async home() {
        // process data, return a `Response`
    },
    blog: {
        async index() {
            // process data, return a `Response`
        },
        async post({ params }) {
            // process data, return a `Response`
        },
    },
} satisfies RouteHandlers<typeof routes>;

// The router is where you piece together the route definitions and implementations for your app
const router = createRouter();
router.use(logger);
router.map(routes, handlers);
```

As the name implies, `@remix-run/fetch-router` is built entirely around the web-standard fetch API and works natively anywhere the fetch API works, such as Deno, Cloudflare Workers, and even web service workers. If you're working with Node.js, you can use the `@remix-run/node-fetch-server` adapter:

```ts
import { createServer } from "node:http";
import { createRequestListener } from "@remix-run/node-fetch-server";

const server = createServer(createRequestListener(request => router.fetch(request)));

const PORT = 1612;
server.listen(PORT, () => console.log(`Your Remix server is running on http://localhost:${PORT}`));
```

## Server Rendering JSX

To server render Remix's JSX runtime, you can use `@remix-run/dom/server`:

```ts
import type { Remix } from "@remix-run/dom";
import { html } from "@remix-run/fetch-router";
import { renderToStream } from "@remix-run/dom/server";

function render(element: Remix.RemixElement, init?: ResponseInit) {
    return html(renderToStream(element), init);
}
```

Now you can render HTML on the server in a type-safe, componentized way:

```tsx
const handlers = {
    async home() {
        return render(
            <html>
                <body>
                    <h1>Home</h1>
                </body>
            </html>
        );
    },
    // ...
} satisfies RouteHandlers<typeof routes>;
```

## Links

The fetch router provides a system for type-safe app links using the object returned from `route()`. Each route segment has the URL-equivalent of `JSON.parse()` and `JSON.stringify()`. There is a type-safe `href()` function which acts as the `JSON.stringify()` of Remix app URLs:

```tsx
const handlers = {
    async home() {
        return render(
            <html>
                <body>
                    <h1>Home</h1>
                    <a href={routes.blog.index.href()}>Blog</a>
                </body>
            </html>
        );
    },
    // ...
} satisfies RouteHandlers<typeof routes>;
```

The `href()` function can also take parameters if its route segment was defined with URL parameters:

```tsx
const handlers = {
    //...
    blog: {
        async index() {
            return render(
                <html>
                    <body>
                        <h1>Blog</h1>

                        <ul>
                            <li>
                                <a href={routes.blog.post.href({ id: "hello-remix" })}>
                                    Hello Remix
                                </a>
                            </li>
                        </ul>
                    </body>
                </html>
            );
        },
        // ...
    },
} satisfies RouteHandlers<typeof routes>;
```

There is also the type-safe `match()` function which acts as the `JSON.parse()` of Remix app URLs:

```tsx
routes.blog.post.match("/blog/hello-remix"); // true
```

This API is mostly used internally by Remix to match routes on incoming requests and should probably be used rarely by the application developer.

## Mutations

Remix 3 relies on good 'ol fashioned HTML forms for mutations. You can pass the action endpoint to your form using the `href()` function:

```tsx
<form action={routes.blog.create.href()} method="POST">
    {/* ... */}
</form>
```

and then receive the formData directly in your handler:

```ts
import type { RouteHandlers } from "@remix-run/fetch-router";
import { html, redirect } from "@remix-run/fetch-router";

const handlers = {
    // ...
    async create({ formData }) {
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        if (!title || !content) {
            return html(`Missing title or content`, { status: 400 });
        }

        const post = await db.createPost({ title, content });
        return redirect(routes.blog.posts.href({ id: post.id }), 303);
    },
} satisfies RouteHandlers<typeof routes>;
```

You can also handle images using the `@remix-run/file-storage` package:

```ts
import type { RouteHandlers } from "@remix-run/fetch-router";
import { html, redirect } from "@remix-run/fetch-router";
import { LocalFileStorage } from "@remix-run/file-storage/local";

const imageStorage = new LocalFileStorage("./images");

const handlers = {
    // ...
    async create({ formData }) {
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const image = formData.get("image") as File;

        if (!title || !content) {
            return html(`Missing title or content`, { status: 400 });
        }

        if (image) {
            await imageStorage.set(post.id, image);
        }

        const post = await db.createPost({ title, content });
        return redirect(routes.blog.posts.href({ id: post.id }), 303);
    },
} satisfies RouteHandlers<typeof routes>;
```

The only file storage provider included with `@remix-run/file-storage` is the `LocalFileStorage` class, but any file storage provider (AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.) can be implemented using the `FileStorage` interface provided by `@remix-run/file-storage`.

## Route Helpers

Routes can be grouped using the same `route` helper you use to declare the top-level `routes` object.

```ts
import { route } from "@remix-run/fetch-router";

const routes = route({
    // ...
    cart: route("/cart", {
        index: "/",

        // API-style endpoints under /cart/api
        api: route("/api", {
            add: { method: "POST", pattern: "/add" },
            update: { method: "PUT", pattern: "/update" },
            remove: { method: "DELETE", pattern: "/remove" },
        }),
    }),
});
```

You can take advantage of pre-made resource routes by using the `resource()` helper. This helper creates Rails-style resource routes which declare all of the necessary routes for the `index`, `show`, `new`, `edit`, `create`, `update`, and `destroy` actions.

```ts
import { resource, route } from "@remix-run/fetch-router";

const routes = route({
    // ...
    // Full CRUD on books
    books: resources("books", { param: "bookId" }),

    // Partial CRUD on users (no create, users self-register)
    users: resources("users", {
        only: ["index", "show", "edit", "update", "destroy"],
        param: "userId",
    }),

    // Orders view-only
    orders: resources("orders", {
        only: ["index", "show"],
        param: "orderId",
    }),
});
```

Finally, you can easily declare a form endpoint using the `formAction()` handler. This creates both an `index` route from which you serve the form UI and an `action` route to which you submit the form's action.

```ts
import { formAction, route } from "@remix-run/fetch-router";

const routes = route({
    // ...
    auth: {
        login: formAction("login"),
        register: formAction("register"),
        logout: { method: "POST", pattern: "/logout" },
        forgotPassword: formAction("forgot-password"),
        resetPassword: formAction("reset-password/:token"),
    },
});
```

## Middleware

Middleware in Remix 3 is simply a function that takes a request context and a `next()` function and returns a response.

```ts
import type { Middleware } from "@remix-run/fetch-router";

import { USER_KEY } from "./auth.ts";

/**
 * Middleware that requires a user to have admin role.
 * Returns 403 Forbidden if user is not an admin.
 * Must be used after requireAuth middleware.
 */
export const requireAdmin: Middleware = async ({ storage }) => {
    let user = storage.get(USER_KEY);

    if (user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
    }
};
```

Middleware can be applied to the entire router:

```ts
import { createRouter } from "@remix-run/fetch-router";

const router = createRouter();
router.use(requireAdmin);
```

Or it can be applied directly to the relevant route which uses it:

```ts
import type { RouteHandlers } from "@remix-run/fetch-router";

const handlers = {
    use: [requireAdmin],
    // ...
} satisfies RouteHandlers<typeof routes.admin>;
```

## Sessions

Sessions can be managed using the `@remix-run/headers` package.

```ts
import { Cookie, SetCookie } from "@remix-run/headers";

export interface SessionData {
    userId?: string;
    sessionId: string;
}

// Simple, in-memory session store for demo purposes
const sessions = new Map<string, SessionData>();

export function getSessionId(request: Request): string {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return createSessionId();

    const cookie = new Cookie(cookieHeader);
    const sessionId = cookie.get("sessionId");

    if (!sessionId) return createSessionId();

    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { sessionId });
    }

    return sessionId;
}

export function getSession(request: Request): SessionData {
    const sessionId = getSessionId(request);
    let session = sessions.get(sessionId);

    if (!session) {
        session = { sessionId };
        sessions.set(sessionId, session);
    }

    return session;
}

export function setSessionCookie(headers: Headers, sessionId: string): void {
    const cookie = new SetCookie({
        name: "sessionId",
        value: sessionId,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        maxAge: 2592000, // 30 days
    });

    headers.set("Set-Cookie", cookie.toString());
}

export function login(sessionId: string, user: User): void {
    let session = sessions.get(sessionId);
    if (!session) {
        session = { sessionId };
        sessions.set(sessionId, session);
    }
    session.userId = user.id;
}

export function logout(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (session) delete session.userId;
}

export function getUserIdFromSession(sessionId: string): string | undefined {
    return sessions.get(sessionId)?.userId;
}
```

## App Storage

Each route handler is passed a `storage` variable as part of its `context` object and this `storage` variable is a type-safe application storage, which works similarly to `this.context`.

```tsx
import { createStorageKey } from "@remix-run/fetch-router";

export const SESSION_ID_KEY = createStorageKey<string>();

export default {
    handlers: {
        async add({ storage }) {
            const sessionId = storage.get(SESSION_ID_KEY);
            // do something with sessionId
        },
    },
};
```

## Hydrated Components

So far, everything we've seen sent down from the server has been entirely server rendered, inert HTML. There are no events, state, or interactions. When you need to manage events, state, or client-side JavaScript behavior, you can create a hydrated component.

Hydrated components are created with the higher-order-function `hydrated()` from `@remix-run/dom`. This function takes two arguments:

1. The path to the compiled JavaScript needed to run this component on the client
2. The stateful Remix component function

In order to use a hydrated component, you will need to compile your hydrated component using a bundler or build tool like ESBuild, Vite, Rspack, Rsbuild, Rolldown, tsdown, or obuild. An ESBuild command for compiling a hydrated component might look something like this:

```sh
esbuild app/assets/*.tsx --outbase=app/assets --outdir=public/assets --bundle --minify --splitting --format=esm --entry-names='[dir]/[name]' --chunk-names='chunks/[name]-[hash]' --sourcemap
```

... to which you could append `--watch` for dev mode.

Then if your route config had a route specified like so:

```ts
const routes = route({
    assets: "/assets/*path",
    // ...
});
```

You could pass the path of your compiled component to your `hydrated()` HOC like so:

```tsx
import { hydrated } from "@remix-run/dom";

export const ImageCarousel = hydrated(
    routes.assets.href({ path: "image-carousel.js#ImageCarousel" })
    // ...
);
```

The client entry point allows you to customize the loading behavior of your hydrated components inside of the `createFrame()` function.

```ts
import { createFrame } from "@remix-run/dom";

createFrame(document, {
    async loadModule(moduleUrl, name) {
        const mod = await import(moduleUrl);
        if (!mod) {
            throw new Error(`Unknown module: ${moduleUrl}#${name}`);
        }

        const Component = mod[name];
        if (!Component) {
            throw new Error(`Unknown component: ${moduleUrl}#${name}`);
        }

        return Component;
    },

    // ...
});
```

## Frames

Inspired by `iframes`, Frames are similar to a combination of the concepts of:

-   `<Suspense>` and `<ErrorBoundary>` in React
-   `<Partial>` in Deno's Fresh framework
-   `hx-swap` in htmx
-   Islands in Astro

Frames solve the problem of how to load a page when some of the content for the page is not ready yet.

Frames take an `src` prop, similar to an `iframe`:

```tsx
<Frame src={routes.fragments.bookCard.href({ slug: 'bbq' })} />
<Frame src={routes.fragments.bookCard.href({ slug: 'heavy-metal' })} />
<Frame src={routes.fragments.bookCard.href({ slug: 'three-ways' })} />
```

The location being pointed to in the Frame's `src` is just another server-rendered route.

During the server render, whenever the Remix reconciler encounters a Frame component, the reconciler calls the `resolveFrame()` function passed to `renderToStream()`.

```tsx
import type { Remix } from "@remix-run/dom";
import { renderToStream } from "@remix-run/dom/server";
import { html } from "@remix-run/fetch-router";

import { routes } from "../../routes.ts";

import { getBookBySlug } from "../models/books.ts";
import { BookCard } from "../components/book-card.tsx";
import { getStorage } from "./context.ts";
import { getCart } from "../models/cart.ts";
import { SESSION_ID_KEY } from "../middleware/auth.ts";

export async function resolveFrame(frameSrc: string) {
    const url = new URL(frameSrc, "http://localhost:44100");

    const bookCardMatch = routes.fragments.bookCard.match(url);
    if (bookCardMatch) {
        const slug = bookCardMatch.params.slug;
        const book = getBookBySlug(slug);

        if (!book) {
            throw new Error(`Book not found: ${slug}`);
        }

        const cart = getCart(getStorage().get(SESSION_ID_KEY));
        const inCart = cart.items.some(item => item.slug === slug);

        return <BookCard book={book} inCart={inCart} />;
    }

    throw new Error(`Failed to fetch ${frameSrc}`);
}

export function render(element: Remix.RemixElement, init?: ResponseInit) {
    return html(renderToStream(element, { resolveFrame }), init);
}
```

Similarly, on the client, the reconciler also finds Frames via a `resolveFrame()` function inside of the `createFrame()` root call:

```ts
import { createFrame } from "@remix-run/dom";

createFrame(document, {
    // ...

    async resolveFrame(frameUrl) {
        let res = await fetch(frameUrl);
        if (res.ok) {
            return res.text();
        }

        throw new Error(`Failed to fetch ${frameUrl}`);
    },
});
```

This can cause the reconciler to block the server response until the Frame resolves, but if you add a `fallback` to your Frame...

```tsx
<Frame
    fallback={<div>Loading...</div>}
    src={routes.fragments.bookCard.href({ slug: 'bbq' })}
/>
<Frame
    fallback={<div>Loading...</div>}
    src={routes.fragments.bookCard.href({ slug: 'heavy-metal' })}
/>
<Frame
    fallback={<div>Loading...</div>}
    src={routes.fragments.bookCard.href({ slug: 'three-ways' })}
/>
```

...the reconciler knows it might take a while to resolve that `src` and it will stream the `fallback` element immediately.

Frames can be composed inside of each other with various `fallback`s or blocking behavior and the Frames will still behave how you would expect them to, even when nested.

Hydrated components work inside Frames. Frames can reload, serve as an error boundary, and have a fallback. In order to reload a frame you can call `this.frame.reload()` from a hydrated component and the nearest frame will reload. If the component from which you call `this.frame.reload()` is not in an explicit frame, then the root frame of the entire application will reload.

```tsx
import { type Remix, hydrated } from "@remix-run/dom";
import { dom } from "@remix-run/events";

import { routes } from "../../routes.ts";

export const CartButton = hydrated(
    routes.assets.href({ path: "cart-button.js#CartButton" }),
    function (this: Remix.Handle) {
        let updating = false;

        return ({ inCart, id, slug }: { inCart: boolean; id: string; slug: string }) => {
            let route = inCart ? routes.cart.api.remove : routes.cart.api.add;
            let method = route.method;
            let action = route.href();

            return (
                <form
                    method={method}
                    action={action}
                    on={dom.submit(async (event, signal) => {
                        event.preventDefault();

                        updating = true;
                        this.update();

                        await fetch(action, {
                            method,
                            body: new FormData(event.currentTarget),
                            signal,
                        });
                        if (signal.aborted) return;

                        await this.frame.reload();
                        if (signal.aborted) return;

                        updating = false;
                        this.update();
                    })}
                >
                    <input type="hidden" name="bookId" value={id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="redirect" value="none" />
                    <button type="submit" class="btn" style={{ opacity: updating ? 0.5 : 1 }}>
                        {inCart ? "Remove from Cart" : "Add to Cart"}
                    </button>
                </form>
            );
        };
    }
);
```

The Remix reconciler is a hybrid reconciler which can accept either vDOM nodes or raw HTML as an update format with which to diff the current vDOM tree against. When a Frame is reloaded, HTML is sent from the server over the wire to the client where the Remix reconciler diffs the HTML received with the current vDOM and make the necessary updates.

The way you pass props back to the server for a Frame is via the URL, either using path parameters, search parameters, or a combination of the two.
