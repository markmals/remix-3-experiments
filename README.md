# Remix 3 Experiments

This is a monorepo of experiments for the **pre-alpha preview release of Remix 3**.

> **Important:** Remix 3 is not related in any way to previous versions of Remix or React Router; they are just created by the same team.

## What's Inside

This repository contains experimental packages and demo applications exploring various aspects of Remix 3's architecture and capabilities.

### Apps

-   **[movies](apps/movies/)** - A full-featured movie catalog application demonstrating Remix 3's server rendering, routing, and hydrated components
-   **[state-playground](apps/state-playground/)** - Experiments with state management patterns in Remix 3

## Documentation

See [AGENTS.md](AGENTS.md) for comprehensive documentation on Remix 3's architecture, including:

-   Event composition with `@remix-run/events`
-   Component model and JSX runtime
-   Server-side routing with `@remix-run/fetch-router`
-   Hydrated components and Frames
-   State management patterns
-   And more...

## Note on Client Router

The `remix-client-router` package that previously lived in this repository has been moved to:

-   **npm package:** [`@webstd-ui/router`](https://www.npmjs.com/package/@webstd-ui/router)
-   **GitHub repository:** [webstd-ui/router](https://github.com/webstd-ui/router)

## Getting Started

This is a Mise monorepo. To get started:

```bash
# Install tools
mise install

# Install dependencies
pnpm install

# Navigate to an app directory to run it
cd apps/movies
# (refer to the app's README for specific run instructions)
```

## Technology Stack

-   **Package Manager:** pnpm with workspaces
-   **Bundling:** tsdown, Rolldown Vite
-   **Code Quality:** Biome
-   **Runtime:** Node.js
