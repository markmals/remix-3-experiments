# Using the View Transition API

This article explains the theory behind how the [View Transition API](/en-US/docs/Web/API/View_Transition_API) works, how to create view transitions and customize the transition animations, and how to manipulate active view transitions. This covers view transitions for both DOM state updates in a single-page app (SPA), and navigating between documents in a multi-page app (MPA).

## The view transition process

Let's walk through the process by which a view transition works:

1. A view transition is triggered. How this is done depends on the type of view transition:
   - In the case of same-document transitions (SPAs), a view transition is triggered by passing the function that would trigger the view change DOM update as a callback to the {{domxref("Document.startViewTransition()", "document.startViewTransition()")}} method.
   - In the case of cross-document transitions (MPAs), a view transition is triggered by initiating navigation to a new document. Both the current and destination documents of the navigation need to be on the same origin, and opt-in to the view transition by including a {{cssxref("@view-transition")}} at rule in their CSS with a `navigation` descriptor of `auto`.
     > [!NOTE]
     > An active view transition has an associated {{domxref("ViewTransition")}} instance (for example, returned by `startViewTransition()` in the case of same-document (SPA) transitions). The `ViewTransition` object includes several promises, allowing you to run code in response to different parts of the view transition process being reached. See [Controlling view transitions with JavaScript](#controlling_view_transitions_with_javascript) for more information.
2. On the current (old page) view, the API captures static image **snapshots** of elements that have a {{cssxref("view-transition-name")}} declared on them.
3. The view change occurs:
   - In the case of same-document transitions (SPAs), the callback passed to `startViewTransition()` is invoked, which causes the DOM to change.

     When the callback has run successfully, the {{domxref("ViewTransition.updateCallbackDone")}} promise fulfills, allowing you to respond to the DOM updating.

   - In the case of cross-document transitions (MPAs), the navigation occurs between the current and destination documents.

4. The API captures "live" snapshots (meaning, interactive DOM regions) from the new view.

   At this point, the view transition is about to run, and the {{domxref("ViewTransition.ready")}} promise fulfills, allowing you to respond by running a custom JavaScript animation instead of the default, for example.

5. The old page snapshots animate "out", while the new view snapshots animate "in". By default, the old view snapshots animate from {{cssxref("opacity")}} 1 to 0, and the new view snapshots animate from `opacity` 0 to 1, which creates a cross-fade.
6. When the transition animations have reached their end states, the {{domxref("ViewTransition.finished")}} promise fulfills, allowing you to respond.

> [!NOTE]
> If the document's [page visibility state](/en-US/docs/Web/API/Page_Visibility_API) is `hidden` (for example if the document is obscured by a window, the browser is minimized, or another browser tab is active) during a {{domxref("Document.startViewTransition()", "document.startViewTransition()")}} call, the view transition is skipped entirely.

### An aside on snapshots

It is worth noting that when talking about view transitions, we commonly use the term _snapshot_ to refer to a part of the page that has a `view-transition-name` declared on it. These sections will be animated separately from other parts of the page with different `view-transition-name` values set on them. While the process of animating a snapshot via a view transition actually involves two separate snapshots—one of the old and one of the new UI states—we use snapshot to refer to the whole page area for simplicity.

The snapshot of the old UI state is a static image, so that the user can't interact with it as it animates "out".

The snapshot of the new UI state is an interactive DOM region, so that the user can start to interact with the new content as it animates "in".

### The view transition pseudo-element tree

To handle creating the outbound and inbound transition animations, the API constructs a pseudo-element tree with the following structure:

```plain
::view-transition
└─ ::view-transition-group(root)
  └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)
      └─ ::view-transition-new(root)
```

In the case of same-document transitions (SPAs), the pseudo-element tree is made available in the document. In the case of cross-document transitions (MPAs), the pseudo-element tree is made available in the destination document only.

The most interesting parts of the tree structure are as follows:

- {{cssxref("::view-transition")}} is the root of the view transitions overlay, which contains all view transition groups and sits above all other page content.
- A {{cssxref("::view-transition-group()")}} acts as a container for each view transition snapshot. The `root` argument specifies the default snapshot — the view transition animation will apply to the snapshot whose `view-transition-name` is `root`. By default, this is a snapshot of the {{cssxref(":root")}} element, because the default browser styles define this:

  ```css
  :root {
    view-transition-name: root;
  }
  ```

  Be aware however that page authors can change this by unsetting the above, and setting `view-transition-name: root` on a different element.

- {{cssxref("::view-transition-old()")}} targets the static snapshot of the old page element, and {{cssxref("::view-transition-new()")}} targets the live snapshot of the new page element. Both of these render as replaced content, in the same manner as an {{htmlelement("img")}} or {{htmlelement("video")}}, meaning that they can be styled with properties like {{cssxref("object-fit")}} and {{cssxref("object-position")}}.

> [!NOTE]
> It is possible to target different DOM elements with different custom view transition animations by setting a different {{cssxref("view-transition-name")}} on each one. In such cases, a `::view-transition-group()` is created for each one. See [Different animations for different elements](#different_animations_for_different_elements) for an example.

> [!NOTE]
> As you'll see later, to customize the outbound and inbound animations you need to target the {{cssxref("::view-transition-old()")}} and {{cssxref("::view-transition-new()")}} pseudo-elements with your animations, respectively.

## Creating a basic view transition

This section illustrates how to create a basic view transition, in both the SPA and MPA case.

### Basic SPA view transition

An SPA may include functionality to fetch new content and update the DOM in response to an event of some kind, such as a navigation link being clicked or an update being pushed from the server.

Our [View Transitions SPA demo](https://mdn.github.io/dom-examples/view-transitions/spa/) is a basic image gallery. We have a series of {{htmlelement("a")}} elements that contain thumbnail {{htmlelement("img")}} elements, dynamically generated using JavaScript. We also have a {{htmlelement("figure")}} element containing a {{htmlelement("figcaption")}} and an `<img>`, which displays the full-size gallery images.

When a thumbnail is clicked, the `displayNewImage()` function is run via {{domxref("Document.startViewTransition()")}}, which causes the full-size image and its associated caption to be displayed inside the `<figure>`. We've encapsulated this inside an `updateView()` function that only calls the View Transition API if the browser supports it:

```js
function updateView(event) {
  // Handle the difference in whether the event is fired on the <a> or the <img>
  const targetIdentifier = event.target.firstChild || event.target;

  const displayNewImage = () => {
    const mainSrc = `${targetIdentifier.src.split("_th.jpg")[0]}.jpg`;
    galleryImg.src = mainSrc;
    galleryCaption.textContent = targetIdentifier.alt;
  };

  // Fallback for browsers that don't support View Transitions:
  if (!document.startViewTransition) {
    displayNewImage();
    return;
  }

  // With View Transitions:
  const transition = document.startViewTransition(() => displayNewImage());
}
```

This code is enough to handle the transition between displayed images. Supporting browsers will show the change from old to new images and captions as a smooth cross-fade (the default view transition). It will still work in non-supporting browsers but without the nice animation.

### Basic MPA view transition

When creating a cross-document (MPA) view transition, the process is even simpler than for SPAs. No JavaScript is required, as the view update is triggered by a cross-document, same-origin navigation rather than a JavaScript-initiated DOM change. To enable a basic MPA view transition, you need to specify a {{cssxref("@view-transition")}} at-rule in the CSS for both the current and destination documents to opt them in, like so:

```css
@view-transition {
  navigation: auto;
}
```

Our [View Transitions MPA demo](https://mdn.github.io/dom-examples/view-transitions/mpa/) shows this at-rule in action, and additionally demonstrates how to [customize the outbound and inbound animations](#customizing_your_animations) of the view transition.

> [!NOTE]
> Currently MPA view transitions can only be created between same-origin documents, but this restriction may be relaxed in future implementations.

## Customizing your animations

The View Transitions pseudo-elements have default [CSS Animations](/en-US/docs/Web/CSS/CSS_animations) applied (which are detailed in their [reference pages](/en-US/docs/Web/API/View_Transition_API#pseudo-elements)).

Most appearance transitions are given a default smooth cross-fade animation, as mentioned above. There are some exceptions:

- `height` and `width` transitions have a smooth scaling animation applied.
- `position` and `transform` transitions have a smooth movement animation applied.

You can modify the default animations in any way you want using regular CSS — target the "from" animation with {{cssxref("::view-transition-old()")}}, and the "to" animation with {{cssxref("::view-transition-new()")}}.

For example, to change the speed of both:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}
```

It is recommended that you target the `::view-transition-group()` with such styles in cases where you want to apply them to `::view-transition-old()` and `::view-transition-new()`. Because of the pseudo-element hierarchy and default user-agent styling, the styles will be inherited by both. For example:

```css
::view-transition-group(root) {
  animation-duration: 0.5s;
}
```

> [!NOTE]
> This is also a good option for safeguarding your code — `::view-transition-group()` also animates and you could end up with different durations for the `group`/`image-pair` pseudo-elements versus the `old` and `new` pseudo-elements.

In the case of cross-document (MPA) transitions, the pseudo-elements need to be included in the destination document only for the view transition to work. If you want to use the view transition in both directions, you'll need to include it in both.

Our [View Transitions MPA demo](https://mdn.github.io/dom-examples/view-transitions/mpa/) includes the above CSS, but takes the customization a step further, defining custom animations and applying them to the `::view-transition-old(root)` and `::view-transition-new(root)` pseudo-elements. The result is that the default cross-fade transition is swapped out for a "swipe up" transition when navigation occurs:

```css
/* Create a custom animation */

@keyframes move-out {
  from {
    transform: translateY(0%);
  }

  to {
    transform: translateY(-100%);
  }
}

@keyframes move-in {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0%);
  }
}

/* Apply the custom animation to the old and new page states */

::view-transition-old(root) {
  animation: 0.4s ease-in both move-out;
}

::view-transition-new(root) {
  animation: 0.4s ease-in both move-in;
}
```

## Different animations for different elements

By default, all of the different elements that change during the view update are transitioned using the same animation. If you want some elements to animate differently from the default `root` animation, you can separate them out using the {{cssxref("view-transition-name")}} property. For example, in our [View Transitions SPA demo](https://mdn.github.io/dom-examples/view-transitions/spa/) the {{htmlelement("figcaption")}} elements are given a `view-transition-name` of `figure-caption` to separate them from the rest of the page in terms of view transitions:

```css
figcaption {
  view-transition-name: figure-caption;
}
```

With this CSS applied, the generated pseudo-element tree will now look like this:

```plain
::view-transition
├─ ::view-transition-group(root)
│ └─ ::view-transition-image-pair(root)
│     ├─ ::view-transition-old(root)
│     └─ ::view-transition-new(root)
└─ ::view-transition-group(figure-caption)
  └─ ::view-transition-image-pair(figure-caption)
      ├─ ::view-transition-old(figure-caption)
      └─ ::view-transition-new(figure-caption)
```

The existence of the second set of pseudo-elements allows separate view transition styling to be applied just to the `<figcaption>`. The different old and new view captures are handled separately from one another.

The following code applies a custom animation just to the `<figcaption>`:

```css
@keyframes grow-x {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes shrink-x {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

::view-transition-group(figure-caption) {
  height: auto;
  right: 0;
  left: auto;
  transform-origin: right center;
}

::view-transition-old(figure-caption) {
  animation: 0.25s linear both shrink-x;
}

::view-transition-new(figure-caption) {
  animation: 0.25s 0.25s linear both grow-x;
}
```

Here we've created a custom CSS animation and applied it to the `::view-transition-old(figure-caption)` and `::view-transition-new(figure-caption)` pseudo-elements. We've also added a number of other styles to both to keep them in the same place and stop the default styling from interfering with our custom animations.

> [!NOTE]
> You can use `*` as the identifier in a pseudo-element to target all snapshot pseudo-elements, regardless of what name they have. For example:
>
> ```css
> ::view-transition-group(*) {
>   animation-duration: 2s;
> }
> ```

### Valid `view-transition-name` values

The `view-transition-name` property can take a unique {{cssxref("custom-ident")}} value, which can be any identifier that wouldn't be misinterpreted as a keyword. The value of `view-transition-name` for each rendered element must be unique. If two rendered elements have the same `view-transition-name` at the same time, {{domxref("ViewTransition.ready")}} will reject and the transition will be skipped.

It can also take keyword values of:

- `none`: Causes the element to not participate in a separate snapshot, unless it has a parent element with a `view-transition-name` set, in which case it will be snapshotted as part of that element.
- `match-element`: Automatically sets unique `view-transition-name` values on all selected elements.

### Taking advantage of the default animation styles

Note that we also discovered another transition option that is simpler and produced a nicer result than the above. Our final `<figcaption>` view transition ended up looking like this:

```css
figcaption {
  view-transition-name: figure-caption;
}

::view-transition-group(figure-caption) {
  height: 100%;
}
```

This works because, by default, `::view-transition-group()` transitions `width` and `height` between the old and new views with a smooth scale. We just needed to set a fixed `height` on both states to make it work.

> [!NOTE]
> [Smooth transitions with the View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions/) contains several other customization examples.

## Controlling view transitions with JavaScript

A view transition has an associated {{domxref("ViewTransition")}} object instance, which contains several promise members allowing you to run JavaScript in response to different states of the transition being reached. For example, {{domxref("ViewTransition.ready")}} fulfills once the pseudo-element tree is created and the animation is about to start, whereas {{domxref("ViewTransition.finished")}} fulfills once the animation is finished, and the new page view is visible and interactive to the user.

The `ViewTransition` can be accessed like so:

1. In the case of same-document (SPA) transitions, the {{domxref("Document.startViewTransition()", "document.startViewTransition()")}} method returns the `ViewTransition` associated with the transition.
2. In the case of cross-document (MPA) transitions:
   - A {{domxref("Window.pageswap_event", "pageswap")}} event is fired when a document is about to be unloaded due to a navigation. Its event object ({{domxref("PageSwapEvent")}}) provides access to the `ViewTransition` via the {{domxref("PageSwapEvent.viewTransition")}} property, as well as a {{domxref("NavigationActivation")}} via {{domxref("PageSwapEvent.activation")}} containing the navigation type and current and destination document history entries.
     > [!NOTE]
     > If the navigation has a cross-origin URL anywhere in the redirect chain, the `activation` property returns `null`.
   - A {{domxref("Window.pagereveal_event", "pagereveal")}} event is fired when a document is first rendered, either when loading a fresh document from the network or activating a document (either from [back/forward cache](/en-US/docs/Glossary/bfcache) (bfcache) or [prerender](/en-US/docs/Glossary/Prerender)). Its event object ({{domxref("PageRevealEvent")}}) provides access to the `ViewTransition` via the {{domxref("PageRevealEvent.viewTransition")}} property.

Let's have a look at some example code to show how these features could be used.

### A JavaScript-powered custom same-document (SPA) transition

The following JavaScript could be used to create a circular reveal view transition emanating from the position of the user's cursor on click, with animation provided by the {{domxref("Web Animations API", "Web Animations API", "", "nocode")}}.

```js
// Store the last click event
let lastClick;
addEventListener("click", (event) => (lastClick = event));

function spaNavigate(data) {
  // Fallback for browsers that don't support this API:
  if (!document.startViewTransition) {
    updateTheDOMSomehow(data);
    return;
  }

  // Get the click position, or fallback to the middle of the screen
  const x = lastClick?.clientX ?? innerWidth / 2;
  const y = lastClick?.clientY ?? innerHeight / 2;
  // Get the distance to the furthest corner
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );

  // Create a transition:
  const transition = document.startViewTransition(() => {
    updateTheDOMSomehow(data);
  });

  // Wait for the pseudo-elements to be created:
  transition.ready.then(() => {
    // Animate the root's new view
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0 at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in",
        // Specify which pseudo-element to animate
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}
```

This animation also requires the following CSS, to turn off the default CSS animation and stop the old and new view states from blending in any way (the new state "wipes" right over the top of the old state, rather than transitioning in):

```css
::view-transition-image-pair(root) {
  isolation: auto;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
  display: block;
}
```

### A JavaScript-powered custom cross-document (MPA) transition

The [List of Chrome DevRel team members](https://view-transitions.chrome.dev/profiles/mpa/) demo provides a basic set of team profile pages, and demonstrates how to use the {{domxref("Window.pageswap_event", "pageswap")}} and {{domxref("Window.pagereveal_event", "pagereveal")}} events to customize the outgoing and inbound animations of a cross-document view transition based on the "from" and "to" URLs.

The {{domxref("Window.pageswap_event", "pageswap")}} event listener looks as follows. This sets view transition names on the elements on the outbound page that link to the profile pages. When navigating from the home page to a profile page, custom animations are provided _only_ for the linked element that is clicked in each case.

```js
window.addEventListener("pageswap", async (e) => {
  // Only run this if an active view transition exists
  if (e.viewTransition) {
    const currentUrl = e.activation.from?.url
      ? new URL(e.activation.from.url)
      : null;
    const targetUrl = new URL(e.activation.entry.url);

    // Going from profile page to homepage
    // ~> The big img and title are the ones!
    if (isProfilePage(currentUrl) && isHomePage(targetUrl)) {
      // Set view-transition-name values on the elements to animate
      document.querySelector(`#detail main h1`).style.viewTransitionName =
        "name";
      document.querySelector(`#detail main img`).style.viewTransitionName =
        "avatar";

      // Remove view-transition-names after snapshots have been taken
      // Stops naming conflicts resulting from the page state persisting in BFCache
      await e.viewTransition.finished;
      document.querySelector(`#detail main h1`).style.viewTransitionName =
        "none";
      document.querySelector(`#detail main img`).style.viewTransitionName =
        "none";
    }

    // Going to profile page
    // ~> The clicked items are the ones!
    if (isProfilePage(targetUrl)) {
      const profile = extractProfileNameFromUrl(targetUrl);

      // Set view-transition-name values on the elements to animate
      document.querySelector(`#${profile} span`).style.viewTransitionName =
        "name";
      document.querySelector(`#${profile} img`).style.viewTransitionName =
        "avatar";

      // Remove view-transition-names after snapshots have been taken
      // Stops naming conflicts resulting from the page state persisting in BFCache
      await e.viewTransition.finished;
      document.querySelector(`#${profile} span`).style.viewTransitionName =
        "none";
      document.querySelector(`#${profile} img`).style.viewTransitionName =
        "none";
    }
  }
});
```

> [!NOTE]
> We remove the `view-transition-name` values after snapshots have been taken in each case. If we left them set, they would persist in the page state saved in the [bfcache](/en-US/docs/Glossary/bfcache) upon navigation. If the back button was then pressed, the `pagereveal` event handler of the page being navigated back to would then attempt to set the same `view-transition-name` values on different elements. If multiple elements have the same `view-transition-name` set, the view transition is skipped.

The {{domxref("Window.pagereveal_event", "pagereveal")}} event listener looks as follows. This works in a similar way to the `pageswap` event listener, although bear in mind that here we are customizing the "to" animation, for page elements on the new page.

```js
window.addEventListener("pagereveal", async (e) => {
  // If the "from" history entry does not exist, return
  if (!navigation.activation.from) return;

  // Only run this if an active view transition exists
  if (e.viewTransition) {
    const fromUrl = new URL(navigation.activation.from.url);
    const currentUrl = new URL(navigation.activation.entry.url);

    // Went from profile page to homepage
    // ~> Set VT names on the relevant list item
    if (isProfilePage(fromUrl) && isHomePage(currentUrl)) {
      const profile = extractProfileNameFromUrl(fromUrl);

      // Set view-transition-name values on the elements to animate
      document.querySelector(`#${profile} span`).style.viewTransitionName =
        "name";
      document.querySelector(`#${profile} img`).style.viewTransitionName =
        "avatar";

      // Remove names after snapshots have been taken
      // so that we're ready for the next navigation
      await e.viewTransition.ready;
      document.querySelector(`#${profile} span`).style.viewTransitionName =
        "none";
      document.querySelector(`#${profile} img`).style.viewTransitionName =
        "none";
    }

    // Went to profile page
    // ~> Set VT names on the main title and image
    if (isProfilePage(currentUrl)) {
      // Set view-transition-name values on the elements to animate
      document.querySelector(`#detail main h1`).style.viewTransitionName =
        "name";
      document.querySelector(`#detail main img`).style.viewTransitionName =
        "avatar";

      // Remove names after snapshots have been taken
      // so that we're ready for the next navigation
      await e.viewTransition.ready;
      document.querySelector(`#detail main h1`).style.viewTransitionName =
        "none";
      document.querySelector(`#detail main img`).style.viewTransitionName =
        "none";
    }
  }
});
```

## Stabilizing page state to make cross-document transitions consistent

Before running a cross-document transition, you ideally want to wait until the state of the page stabilizes, relying on [render blocking](/en-US/docs/Glossary/Render_blocking) to ensure that:

1. Critical styles are loaded and applied.
2. Critical scripts are loaded and run.
3. The HTML visible for the user's initial view of the page has been parsed, so it renders consistently.

Styles are render blocked by default unless they are added to the document dynamically, via script. Both scripts and dynamically-added styles can be render blocked using the [`blocking="render"`](/en-US/docs/Web/HTML/Reference/Elements/script#blocking) attribute.

To ensure that your initial HTML has been parsed and will always render consistently before the transition animation runs, you can use [`<link rel="expect">`](/en-US/docs/Web/HTML/Reference/Attributes/rel#expect). In this element, you include the following attributes:

- `rel="expect"` to indicate that you want to use this `<link>` element to render block some HTML on the page.
- `href="#element-id"` to indicate the ID of the element you want to render block.
- `blocking="render"` to render block the specified HTML.

> [!NOTE]
> In order to block rendering, `script`, `link`, and `style` elements with `blocking="render"` must be in the `head` of the document.

Let's explore what this looks like with an example HTML document:

```html
<!doctype html>
<html lang="en">
  <head>
    <!-- This will be render-blocking by default -->
    <link rel="stylesheet" href="style.css" />

    <!-- Marking critical scripts as render blocking will
         ensure they're run before the view transition is activated -->
    <script async src="layout.js" blocking="render"></script>

    <!-- Use rel="expect" and blocking="render" to ensure the
         #lead-content element is visible and fully parsed before
         activating the transition -->
    <link rel="expect" href="#lead-content" blocking="render" />
  </head>
  <body>
    <h1>Page title</h1>
    <nav>...</nav>
    <div id="lead-content">
      <section id="first-section">The first section</section>
      <section>The second section</section>
    </div>
  </body>
</html>
```

The result is that document rendering is blocked until the lead content `<div>` has been parsed, ensuring a consistent view transition.

You can also specify a [`media`](/en-US/docs/Web/HTML/Reference/Elements/link#media) attribute on `<link rel="expect">` elements. For example, you might want to block rendering on a smaller amount of content when loading the page on a narrow-screen device, than on a wide-screen device. This makes sense — on a mobile, less content will be visible when the page first loads than in the case of a desktop.

This could be achieved with the following HTML:

```html
<link
  rel="expect"
  href="#lead-content"
  blocking="render"
  media="screen and (width > 640px)" />
<link
  rel="expect"
  href="#first-section"
  blocking="render"
  media="screen and (width <= 640px)" />
```


# Nitro

└── docs
└── 1.docs
├── .navigation.yml
├── 1.index.md
├── 2.quick-start.md
├── 4.renderer.md
├── 5.routing.md
├── 50.assets.md
├── 50.configuration.md
├── 50.database.md
├── 50.lifecycle.md
├── 50.plugins.md
├── 50.tasks.md
├── 6.server-entry.md
├── 7.cache.md
├── 8.storage.md
├── 99.migration.md
└── 99.nightly.md

## /docs/1.docs/.navigation.yml:

1 | icon: i-lucide-book-open
2 |

---

## /docs/1.docs/1.index.md:

1 | ---
2 | icon: i-lucide-compass
3 | ---
4 |
5 | # Introduction
6 |
7 | > Nitro is a full-stack framework, compatible with any runtime. It extends your Vite application with a production-ready server.
8 |
9 | Vite’s main purpose is to build frontend applications. It provides a fast dev server to transform and serve resources with HMR, but it doesn’t include a production server.
10 |
11 | When creating an SPA, you often need to add API routes—whether to bypass CORS, call services with an API token, or implement your own backend logic. Nitro lets you create server and API routes inside the `routes/` directory of your project. You can even go further and take control of the entire server entry by creating a `server.ts` file. With its high-level and runtime-agnostic approach, Nitro allows you to use any HTTP library, such as [Elysia](https://elysiajs.com/), [h3](https://h3.dev) or [Hono](https://hono.dev).
12 |
13 | But that’s not all: running `vite build` also builds both your backend and frontend code into an optimized `.output/` folder. This output is compatible not only with Node.js, Bun, and Deno, but also with many hosting platforms without any configuration. This means you can deploy your full-stack Vite application to Cloudflare Workers, Netlify, Vercel, and more, without changing a single line of code, while taking advantage of platform features like ESR, ISR, and SWR.
14 |
15 | The Nitro server is highly performant. By combining code-splitting with compiled routes, it removes the need for a runtime router, leaving only minimal compiled logic. This makes it ideal for serverless hosting, since boot-up time is nearly 0ms regardless of project size and only the code required to handle the incoming request is loaded and executed.
16 |
17 | Having a server also unlocks server-side rendering. You can render HTML with your favorite templating engine, or use component libraries such as React, Vue, or Svelte directly on the server. You can even go full universal rendering with client-side hydration. Nitro provides the foundation and a progressive approach to reach your goals.
18 |
19 | Server data storage is often needed, and Nitro includes a runtime-agnostic key-value storage layer out of the box. It uses in-memory storage by default, but you can connect more than 20 different drivers (FS, Redis, S3, etc.), attach them to different namespaces, and swap them without changing your code.
20 |
21 | Caching is a key part of any web server, which is why Nitro supports caching for both server routes and server functions, backed directly by the server storage (via the `cache` namespace).
22 |
23 | When key-value storage isn’t enough, Nitro also includes a built-in SQL database. It defaults to SQLite, but you can connect to and query more than 10 databases (Postgres, MySQL, PGLite, etc.) using the same API.
24 |
25 | Last but not least, Nitro can be used as the foundation for building your own meta-framework. Popular frameworks such as Nuxt, SolidStart and TanStack Start fully or partially leverage Nitro.
26 |
27 | Ready to give it a try? Jump into the [quick start](/docs/quick-start).
28 |

---

## /docs/1.docs/2.quick-start.md:

1 | ---
2 | icon: i-lucide-zap
3 | ---
4 |
5 | # Quick Start
6 |
7 | > Start with a fresh Nitro project or adopt it in your current Vite project.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | ## Try Nitro online
14 |
15 | Get a taste of Nitro in your browser using our playground.
16 |
17 | ::card-group
18 | ::card
19 | ---
20 | to: https://stackblitz.com/github/nitrojs/starter/tree/v3-vite?file=index.html,server.ts
21 | icon: i-logos-stackblitz-icon
22 | title: Nitro+Vite Starter
23 | target: \_blank
24 | ---
25 | Play with Nitro in your browser with a minimal vite project.
26 | ::
27 | ::
28 |
29 |
30 | ## Create a Nitro project
31 |
32 | The fastest way to create a Nitro application is using the `create-nitro-app`.
33 |
34 | > [!NOTE]
35 | > Make sure to have installed the latest LTS version of either [Node.js](https://nodejs.org/en), [Bun](https://bun.sh/), or [Deno](https://deno.com/).
36 |
37 | :pm-x{command="create-nitro-app"}
38 |
39 | <div style="display:flex;justify-content:center;">
40 | <img src="https://github.com/nitrojs/create-nitro-app/blob/main/.images/preview.png?raw=true" alt="Preview" style="max-width:100%;height:auto;display:block;" />
41 | </div>
42 |
43 | Follow the instructions from the CLI and you will be ready to start your development server.
44 |
45 | ## Add to a Vite project
46 |
47 | To add Nitro to an existing Vite project, follow these instructions:
48 |
49 | ::steps{level="3"}
50 |
51 | ### Install `nitro` package
52 |
53 | :pm-install{name="nitro"}
54 |
55 | ### Add Nitro plugin
56 |
57 | `js [vite.config.mjs] {2,6}
58 | import { defineConfig } from "vite";
59 | import { nitro } from "nitro/vite";
60 | 
61 | export default defineConfig({
62 |   plugins: [
63 |     nitro()
64 |   ],
65 | });
66 | `
67 |
68 | ::
69 |
70 |
71 | That's it, you can now add server and API routes to your Vite project!
72 |

---

## /docs/1.docs/4.renderer.md:

1 | ---
2 | icon: ri:layout-masonry-line
3 | navigation:
4 | title: Renderer
5 | ---
6 |
7 | # Nitro Renderer
8 |
9 | > Use a renderer to handle all unmatched routes with custom HTML or a templating system.
10 |
11 | ::warning
12 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
13 | ::
14 |
15 | The renderer is a special handler in Nitro that catches all routes that don't match any specific API or route handler. It's commonly used for server-side rendering (SSR), serving single-page applications (SPAs), or creating custom HTML responses.
16 |
17 | ## HTML template
18 |
19 | ### Auto-detected `index.html`
20 |
21 | By default, Nitro automatically looks for an `index.html` file in your project src dir.
22 |
23 | If found, Nitro will use it as the renderer template and serve it for all unmatched routes.
24 |
25 | ::code-group
26 | `html [index.html]
 27 | <!DOCTYPE html>
 28 | <html lang="en">
 29 |   <head>
 30 |     <meta charset="UTF-8" />
 31 |     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 32 |     <title>My Vite + Nitro App</title>
 33 |   </head>
 34 |   <body>
 35 |     <div id="app"></div>
 36 |     <script type="module" src="/src/main.ts"></script>
 37 |   </body>
 38 | </html>
 39 | `
40 | `ts [routes/api/hello.ts]
 41 | import { defineHandler } from "nitro/h3";
 42 | 
 43 | export default defineHandler((event) => {
 44 |   return { hello: "API" };
 45 | });
 46 | `
47 | ::
48 |
49 | ::tip
50 | When `index.html` is detected, Nitro will automatically log in the terminal: `Using index.html as renderer template.`
51 | ::
52 |
53 | With this setup:
54 | - `/api/hello` → Handled by your API routes
55 | - `/about`, `/contact`, etc. → Served with `index.html`
56 |
57 | ### Custom HTML file
58 |
59 | You can specify a custom HTML template file using the `renderer.template` option in your Nitro configuration.
60 |
61 | ::code-group
62 | `ts [nitro.config.ts]
 63 | import { defineNitroConfig } from "nitro/config";
 64 | 
 65 | export default defineNitroConfig({
 66 |   renderer: {
 67 |     template: './app.html'
 68 |   }
 69 | })
 70 | `
71 |
72 | `html [app.html]
 73 | <!DOCTYPE html>
 74 | <html lang="en">
 75 |   <head>
 76 |     <meta charset="UTF-8" />
 77 |     <title>Custom Template</title>
 78 |   </head>
 79 |   <body>
 80 |     <div id="root">Loading...</div>
 81 |     <script type="module" src="/src/main.js"></script>
 82 |   </body>
 83 | </html>
 84 | `
85 | ::
86 |
87 | ### Hypertext Preprocessor (experimental)
88 |
89 | Nitro uses [rendu](https://github.com/h3js/rendu) Hypertext Preprocessor, which provides a simple and powerful way to create dynamic HTML templates with JavaScript expressions.
90 |
91 | You can use special delimiters to inject dynamic content:
92 | - `{{ content }}` to output HTML-escaped content
93 | - `{{{ content }}}` or `<?= expression ?>` to output raw (unescaped) content
94 | - `<? ... ?>` for JavaScript control flow
95 |
96 | It also exposes global variables:
97 | - `$REQUEST`: The incoming Request object
98 | - `$METHOD`: HTTP method (GET, POST, etc.)
99 | - `$URL`: Request URL object
100 | - `$HEADERS`: Request headers
101 | - `$RESPONSE`: Response configuration object
102 | - `$COOKIES`: Read-only object containing request cookies
103 |
104 | `html [index.html]
105 | <!DOCTYPE html>
106 | <html lang="en">
107 |   <head>
108 |     <meta charset="UTF-8" />
109 |     <title>Dynamic template</title>
110 |   </head>
111 |   <body>
112 |     <h1>Hello {{ $REQUEST.url }}</h1>
113 |   </body>
114 | </html>
115 | `
116 |
117 | :read-more{to="https://github.com/h3js/rendu" title="Rendu Documentation"}
118 |
119 | ## Custom renderer handler
120 |
121 | For more complex scenarios, you can create a custom renderer handler that programmatically generates responses.
122 |
123 | Create a renderer file and use `defineRenderHandler` to define your custom rendering logic:
124 |
125 | `` ts [renderer.ts]
126 | import { defineRenderHandler } from "nitro/runtime";
127 | 
128 | export default defineRenderHandler((event) => {
129 |   return {
130 |     body: `<!DOCTYPE html>
131 |       <html>
132 |         <head>
133 |           <title>Custom Renderer</title>
134 |         </head>
135 |         <body>
136 |           <h1>Hello from custom renderer!</h1>
137 |           <p>Current path: ${event.path}</p>
138 |         </body>
139 |       </html>`,
140 |     headers: {
141 |       'content-type': 'text/html; charset=utf-8'
142 |     }
143 |   }
144 | })
145 |  ``
146 |
147 | Then, specify the renderer entry in the Nitro config:
148 |
149 | `ts [nitro.config.ts]
150 | import { defineNitroConfig } from "nitro/config";
151 | 
152 | export default defineNitroConfig({
153 |   renderer: {
154 |     entry: './renderer.ts'
155 |   }
156 | })
157 | `
158 |
159 | ## Renderer priority
160 |
161 | The renderer always acts as a catch-all route (`/**`) and has the **lowest priority**. This means:
162 |
163 | 1. Specific API routes are matched first (e.g., `/api/users`)
164 | 2. Specific server routes are matched next (e.g., `/about`)
165 | 3. The renderer catches everything else
166 |
167 | `md
168 | api/
169 |   users.ts        → /api/users (matched first)
170 | routes/
171 |   about.ts        → /about (matched second)
172 | renderer.ts         → /** (catches all other routes)
173 | `
174 |
175 | ::warning
176 | If you define a catch-all route (`[...].ts`) in your routes, Nitro will warn you that the renderer will override it. Use more specific routes or different HTTP methods to avoid conflicts.
177 | ::
178 |
179 | :read-more{to="/docs/architecture#request-lifecycle" title="Architecture > Request lifecycle"}
180 |
181 | ## Use Cases
182 |
183 | ### Single-Page Application (SPA)
184 |
185 | Serve your SPA's `index.html` for all routes to enable client-side routing:
186 |
187 | > [!TIP]
188 | > This is the default behavior of Nitro when used with Vite.
189 |
190 | <!-- ### Server-Side Rendering (SSR) -->
191 |
192 | <!-- TODO: Add example with ssr-outlet and vite -->
193 |

---

## /docs/1.docs/5.routing.md:

1 | ---
2 | icon: ri:direction-line
3 | ---
4 |
5 | # Routing
6 |
7 | > Nitro supports filesystem routing to automatically map files to routes. By combining code-splitting with compiled routes, it removes the need for a runtime router, leaving only minimal compiled logic.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | ## Request handler
14 |
15 | Nitro request handler is a function accepting an `event` object, which is a [H3Event](https://h3.dev/guide/api/h3event#h3event-properties) object.
16 |
17 | ::code-group
18 | `ts [Single function]
 19 | import type { H3Event } from "nitro/h3";
 20 | 
 21 | export default (event: H3Event) => {
 22 |   return "world";
 23 | }
 24 | `
25 | `ts [defineHandler]
 26 | import { defineHandler } from "nitro/h3";
 27 | 
 28 | // For better type inference
 29 | export default defineHandler((event) => {
 30 |   return "world";
 31 | });
 32 | `
33 | ::
34 |
35 | ## Filesystem routing
36 |
37 | Nitro supports file-based routing for your API routes (files are automatically mapped to [h3 routes](https://h3.dev/guide/basics/routing)). Defining a route is as simple as creating a file inside the `api/` or `routes/` directory.
38 |
39 | You can only define one handler per files and you can [append the HTTP method](#specific-request-method) to the filename to define a specific request method.
40 |
41 | ` 42 | routes/
 43 |   api/
 44 |     test.ts      <-- /api/test
 45 |   hello.get.ts   <-- /hello (GET only)
 46 |   hello.post.ts  <-- /hello (POST only)
 47 | vite.config.ts
 48 |`
49 |
50 | You can nest routes by creating subdirectories.
51 |
52 | `txt
 53 | routes/
 54 |   api/
 55 |     [org]/
 56 |       [repo]/
 57 |         index.ts   <-- /api/:org/:repo
 58 |         issues.ts  <-- /api/:org/:repo/issues
 59 |       index.ts     <-- /api/:org
 60 | package.json
 61 | `
62 |
63 | ### Static routes
64 |
65 | First, create a file in `routes/` or `routes/api/` directory. The filename will be the route path.
66 |
67 | Then, export a fetch-compatible function:
68 |
69 | `ts [routes/api/test.ts]
 70 | import { defineHandler } from "nitro/h3";
 71 | 
 72 | export default defineHandler(() => {
 73 |   return { hello: "API" };
 74 | });
 75 | `
76 |
77 | ### Dynamic routes
78 |
79 | #### Single param
80 |
81 | To define a route with params, use the `[<param>]` syntax where `<param>` is the name of the param. The param will be available in the `event.context.params` object or using the [`getRouterParam`](https://h3.dev/utils/request#getrouterparamevent-name-opts-decode) utility.
82 |
83 | `` ts [routes/hello/[name\\].ts]
 84 | import { defineHandler } from "nitro/h3";
 85 | 
 86 | export default defineHandler((event) => {
 87 |   const { name } = event.context.params;
 88 | 
 89 |   return `Hello ${name}!`;
 90 | });
 91 |  ``
92 |
93 | Call the route with the param `/hello/nitro`, you will get:
94 |
95 | `txt [Response]
 96 | Hello nitro!
 97 | `
98 |
99 | #### Multiple params
100 |
101 | You can define multiple params in a route using `[<param1>]/[<param2>]` syntax where each param is a folder. You **cannot** define multiple params in a single filename of folder.
102 |
103 | `` ts [routes/hello/[name\\]/[age\\].ts]
104 | import { defineHandler } from "nitro/h3";
105 | 
106 | export default defineHandler((event) => {
107 |   const { name, age } = event.context.params;
108 | 
109 |   return `Hello ${name}! You are ${age} years old.`;
110 | });
111 |  ``
112 |
113 | #### Catch-all params
114 |
115 | You can capture all the remaining parts of a URL using `[...<param>]` syntax. This will include the `/` in the param.
116 |
117 | `` ts [routes/hello/[...name\\].ts]
118 | import { defineHandler } from "nitro/h3";
119 | 
120 | export default defineHandler((event) => {
121 |   const { name } = event.context.params;
122 | 
123 |   return `Hello ${name}!`;
124 | });
125 |  ``
126 |
127 | Call the route with the param `/hello/nitro/is/hot`, you will get:
128 |
129 | `txt [Response]
130 | Hello nitro/is/hot!
131 | `
132 |
133 | ### Specific request method
134 |
135 | You can append the HTTP method to the filename to force the route to be matched only for a specific HTTP request method, for example `hello.get.ts` will only match for `GET` requests. You can use any HTTP method you want.
136 |
137 | ::code-group
138 | `` js [GET]
139 | // routes/users/[id].get.ts
140 | import { defineHandler } from "nitro/h3";
141 | 
142 | export default defineHandler(async (event) => {
143 |   const { id } = event.context.params;
144 | 
145 |   // Do something with id
146 | 
147 |   return `User profile!`;
148 | });
149 |  ``
150 |
151 | `js [POST]
152 | // routes/users.post.ts
153 | import { defineHandler, readBody } from "nitro/h3";
154 | 
155 | export default defineHandler(async (event) => {
156 |   const body = await readBody(event);
157 | 
158 |   // Do something with body like saving it to a database
159 | 
160 |   return { updated: true };
161 | });
162 | `
163 | ::
164 |
165 | ### Catch-all route
166 |
167 | You can create a special route that will match all routes that are not matched by any other route. This is useful for creating a default route.
168 |
169 | To create a catch-all route, create a file named `[...].ts`.
170 |
171 | `` ts [routes/[...\\].ts]
172 | import { defineHandler } from "nitro/h3";
173 | 
174 | export default defineHandler((event) => {
175 |   return `Hello ${event.url}!`;
176 | });
177 |  ``
178 |
179 | ### Environment specific handlers
180 |
181 | You can specify for a route that will only be included in specific builds by adding a `.dev`, `.prod` or `.prerender` suffix to the file name, for example: `routes/test.get.dev.ts` or `routes/test.get.prod.ts`.
182 |
183 | > [!TIP]
184 | > You can specify multiple environments or specify a preset name as environment using programmatic registration of routes via `handlers[]` config.
185 |
186 | ## Middleware
187 |
188 | Nitro route middleware can hook into the request lifecycle.
189 |
190 | ::tip
191 | A middleware can modify the request before it is processed, not after.
192 | ::
193 |
194 | Middleware are auto-registered within the `middleware/` directory.
195 |
196 | `md
197 | middleware/
198 |   auth.ts
199 |   logger.ts
200 |   ...
201 | routes/
202 |   hello.ts
203 | `
204 |
205 | ### Simple middleware
206 |
207 | Middleware are defined exactly like route handlers with the only exception that they should not return anything.
208 | Returning from middleware behaves like returning from a request - the value will be returned as a response and further code will not be ran.
209 |
210 | `ts [middleware/auth.ts]
211 | import { defineHandler } from "nitro/h3";
212 | 
213 | export default defineHandler((event) => {
214 |   // Extends or modify the event
215 |   event.context.user = { name: "Nitro" };
216 | });
217 | `
218 |
219 | Middleware in `middleware/` directory are automatically registered for all routes. If you want to register a middleware for a specific route, see [Object Syntax Event Handler](https://h3.dev/guide/basics/handler#object-syntax).
220 |
221 | ::note
222 | Returning anything from a middleware will close the request and should be avoided! Any returned value from middleware will be the response and further code will not be executed however **this is not recommended to do!**
223 | ::
224 |
225 | ### Route Meta
226 |
227 | You can define route handler meta at build-time using `defineRouteMeta` macro in the event handler files.
228 |
229 | > [!IMPORTANT]
230 | > 🚧 This feature is currently experimental.
231 |
232 | `ts [routes/api/test.ts]
233 | import { defineRouteMeta } from "nitro/runtime";
234 | import { defineHandler } from "nitro/h3";
235 | 
236 | defineRouteMeta({
237 |   openAPI: {
238 |     tags: ["test"],
239 |     description: "Test route description",
240 |     parameters: [{ in: "query", name: "test", required: true }],
241 |   },
242 | });
243 | 
244 | export default defineHandler(() => "OK");
245 | `
246 |
247 | ::read-more{to="https://swagger.io/specification/v3/"}
248 | This feature is currently usable to specify OpenAPI meta. See swagger specification for available OpenAPI options.
249 | ::
250 |
251 | ### Execution order
252 |
253 | Middleware are executed in directory listing order.
254 |
255 | `md
256 | middleware/
257 |   auth.ts <-- First
258 |   logger.ts <-- Second
259 |   ... <-- Third
260 | `
261 |
262 | Prefix middleware with a number to control their execution order.
263 |
264 | `md
265 | middleware/
266 |   1.logger.ts <-- First
267 |   2.auth.ts <-- Second
268 |   3.... <-- Third
269 | `
270 | ::note
271 | Remember that file names are sorted as strings, thus for example if you have 3 files `1.filename.ts`, `2.filename.ts` and `10.filename.ts`, the `10.filename.ts` will come after the `1.filename.ts`. To avoid this, prefix `1-9` with a `0` like `01`, if you have more than 10 middleware in the same directory.
272 | ::
273 |
274 | ### Request filtering
275 |
276 | Middleware are executed on every request.
277 |
278 | Apply custom logic to scope them to specific conditions.
279 |
280 | For example, you can use the URL to apply a middleware to a specific route:
281 |
282 | `ts [middleware/auth.ts]
283 | import { defineHandler } from "nitro/h3";
284 | 
285 | export default defineHandler((event) => {
286 |   // Will only execute for /auth route
287 |   if (event.url.pathname.startsWith('/auth')) {
288 |     event.context.user = { name: "Nitro" };
289 |   }
290 | });
291 | `
292 |
293 | ## Error handling
294 |
295 | You can use the [utilities available in H3](https://h3.dev/guide/basics/error) to handle errors in both routes and middlewares.
296 |
297 | The way errors are sent back to the client depends on the route's path. For most routes `Content-Type` is set to `text/html` by default and a simple html error page is delivered. If the route starts with `/api/` (either because it is placed in `api/` or `routes/api/`) the default will change to `application/json` and a JSON object will be sent.
298 |
299 | This behaviour can be overridden by some request properties (e.g.: `Accept` or `User-Agent` headers).
300 |
301 | ## Route rules
302 |
303 | Nitro allows you to add logic at the top-level for each route of your configuration. It can be used for redirecting, proxying, caching and adding headers to routes.
304 |
305 | It is a map from route pattern (following [rou3](https://github.com/h3js/rou3)) to route options.
306 |
307 | When `cache` option is set, handlers matching pattern will be automatically wrapped with `defineCachedEventHandler`. See the [cache guide](/docs/cache) to learn more about this function.
308 |
309 | ::note
310 | `swr: true|number` is shortcut for `cache: { swr: true, maxAge: number }`
311 | ::
312 |
313 | You can set route rules in the `nitro.routeRules` options.
314 |
315 | `ts [nitro.config.ts]
316 | import { defineNitroConfig } from "nitro/config";
317 | 
318 | export default defineConfig({
319 |   routeRules: {
320 |     '/blog/**': { swr: true },
321 |     '/blog/**': { swr: 600 },
322 |     '/blog/**': { static: true },
323 |     '/blog/**': { cache: { /* cache options*/ } },
324 |     '/assets/**': { headers: { 'cache-control': 's-maxage=0' } },
325 |     '/api/v1/**': { cors: true, headers: { 'access-control-allow-methods': 'GET' } },
326 |     '/old-page': { redirect: '/new-page' },
327 |     '/old-page/**': { redirect: '/new-page/**' },
328 |     '/proxy/example': { proxy: 'https://example.com' },
329 |     '/proxy/**': { proxy: '/api/**' },
330 |   }
331 | });
332 | `
333 |

---

## /docs/1.docs/50.assets.md:

1 | ---
2 | icon: ri:image-2-line
3 | ---
4 |
5 | # Assets
6 |
7 | ## Public Assets
8 |
9 | Nitro handles assets via the `public/` directory.
10 |
11 | ::warning
12 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
13 | ::
14 |
15 | All assets in `public/` directory will be automatically served. This means that you can access them directly from the browser without any special configuration.
16 |
17 | `md
 18 | public/
 19 |   image.png     <-- /image.png
 20 |   video.mp4     <-- /video.mp4
 21 |   robots.txt    <-- /robots.txt
 22 | `
23 |
24 | ### Production public assets
25 |
26 | When building your Nitro app, the `public/` directory will be copied to `.output/public/` and a manifest with metadata will be created and embedded in the server bundle.
27 |
28 | `json
 29 | {
 30 |   "/image.png": {
 31 |     "type": "image/png",
 32 |     "etag": "\"4a0c-6utWq0Kbk5OqDmksYCa9XV8irnM\"",
 33 |     "mtime": "2023-03-04T21:39:45.086Z",
 34 |     "size": 18956
 35 |   },
 36 |   "/robots.txt": {
 37 |     "type": "text/plain; charset=utf-8",
 38 |     "etag": "\"8-hMqyDrA8fJ0R904zgEPs3L55Jls\"",
 39 |     "mtime": "2023-03-04T21:39:45.086Z",
 40 |     "size": 8
 41 |   },
 42 |   "/video.mp4": {
 43 |     "type": "video/mp4",
 44 |     "etag": "\"9b943-4UwfQXKUjPCesGPr6J5j7GzNYGU\"",
 45 |     "mtime": "2023-03-04T21:39:45.085Z",
 46 |     "size": 637251
 47 |   }
 48 | }
 49 | `
50 |
51 | This allows Nitro to know the public assets without scanning the directory, giving high performance with caching headers.
52 |
53 | ## Server assets
54 |
55 | All assets in `assets/` directory will be added to the server bundle. After building your application, you can find them in the `.output/server/chunks/raw/` directory. Be careful with the size of your assets, as they will be bundled with the server bundle.
56 |
57 | > [!TIP]
58 | > Unless using `useStorage()`, assets won't be included in sever bundle.
59 |
60 | They can be addressed by the `assets:server` mount point using the [storage layer](/docs/storage).
61 |
62 | For example, you could store a json file in `assets/data.json` and retrieve it in your handler:
63 |
64 | `js
 65 | import { defineHandler } from "nitro/h3";
 66 | 
 67 | export default defineHandler(async () => {
 68 |   const data = await useStorage("assets:server").get("data.json");
 69 | 
 70 |   return data;
 71 | });
 72 | `
73 |
74 | ### Custom server assets
75 |
76 | In order to add assets from a custom directory, you will need to define a path in your nitro config. This allows you to add assets from a directory outside of the `assets/` directory.
77 |
78 | `js [nitro.config.ts]
 79 | import { defineNitroConfig } from "nitro/config";
 80 | 
 81 | export default defineNitroConfig({
 82 |   serverAssets: [{
 83 |     baseName: 'my_directory',
 84 |     dir: './my_directory'
 85 |   }]
 86 | })
 87 | `
88 |
89 | You could want to add a directory with html templates for example.
90 |
91 | `js [nitro.config.ts]
 92 | import { defineNitroConfig } from "nitro/config";
 93 | 
 94 | export default defineNitroConfig({
 95 |   serverAssets: [{
 96 |     baseName: 'templates',
 97 |     dir: './templates'
 98 |   }]
 99 | })
100 | `
101 |
102 | Then you can use the `assets:templates` base to retrieve your assets.
103 |
104 | `ts [handlers/success.ts]
105 | import { defineHandler } from "nitro/h3";
106 | 
107 | export default defineHandler(async (event) => {
108 |   const html = await useStorage("assets:templates").get("success.html");
109 | 
110 |   return html;
111 | });
112 | `
113 |

---

## /docs/1.docs/50.configuration.md:

1 | ---
2 | icon: ri:settings-3-line
3 | ---
4 |
5 | # Configuration
6 |
7 | > Customize and extend Nitro defaults.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | ::read-more{to="/config"}
14 | See [config reference](/config) for available options.
15 | ::
16 |
17 | You can customize your Nitro builder with a configuration file.
18 |
19 | `ts [nitro.config.ts]
 20 | import { defineNitroConfig } from "nitro/config";
 21 | 
 22 | export default defineNitroConfig({
 23 |   // Nitro options
 24 | })
 25 | `
26 | `ts [vite.config.ts]
 27 | import { defineConfig } from 'vite'
 28 | import { nitro } from 'nitro/vite'
 29 | 
 30 | export default defineConfig({
 31 |   plugins: [
 32 |     nitro()
 33 |   ],
 34 |   nitro: {
 35 |     // Nitro options
 36 |   }
 37 | })
 38 | 
 39 | `
40 |
41 | > [!TIP]
42 | > Nitro loads the configuration using [c12](https://github.com/unjs/c12), giving more possibilities such as using `.nitrorc` file in current working directory or in the user's home directory.
43 |
44 | ## Runtime configuration
45 |
46 | Nitro provides a runtime config API to expose configuration within your application, with the ability to update it at runtime by setting environment variables. This is useful when you want to expose different configuration values for different environments (e.g. development, staging, production). For example, you can use this to expose different API endpoints for different environments or to expose different feature flags.
47 |
48 | First, you need to define the runtime config in your configuration file.
49 |
50 | `` ts [nitro.config.ts]
 51 | import { defineNitroConfig } from "nitro/config";
 52 | 
 53 | export default defineNitroConfig({
 54 |   runtimeConfig: {
 55 |     apiToken: "dev_token", // `dev_token` is the default value
 56 |   }
 57 | });
 58 |  ``
59 |
60 | You can now access the runtime config using `useRuntimeConfig(event)`. Use `useRuntimeConfig(event)` within event handlers and utilities and **avoid** calling it in ambient global contexts. This could lead to unexpected behavior such as sharing the same runtime config across different requests.
61 |
62 |
63 | `` ts [api/example.get.ts]
 64 | import { defineHandler } from "nitro/h3";
 65 | 
 66 | export default defineHandler((event) => {
 67 |   return useRuntimeConfig(event).apiToken; // Returns `dev_token`
 68 | });
 69 |  ``
70 |
71 | ### Local development
72 |
73 | Finally, you can update the runtime config using environment variables. You can use a `.env` or `.env.local` file in development and use platform variables in production (see below).
74 |
75 | Create an `.env` file in your project root:
76 |
77 | `bash [.env]
 78 | NITRO_API_TOKEN="123"
 79 | `
80 |
81 | Re-start the development server, fetch the `/api/example` endpoint and you should see `123` as the response instead of `dev_token`.
82 |
83 | Do not forget that you can still universally access environment variables using `import.meta.env` or `process.env` but avoid using them in ambiant global contexts to prevent unexpected behavior.
84 |
85 | ### Production
86 |
87 | You can define variables in your production environment to update the runtime config. All variables must be prefixed with `NITRO_` to be applied to the runtime config. They will override the runtime config variables defined within your `nitro.config.ts` file.
88 |
89 | `bash [.env]
 90 | NITRO_API_TOKEN="123"
 91 | `
92 |
93 | In runtime config, define key using camelCase. In environment variables, define key using snake_case and uppercase.
94 |
95 | `ts
 96 | {
 97 |   helloWorld: "foo"
 98 | }
 99 | `
100 |
101 | `bash
102 | NITRO_HELLO_WORLD="foo"
103 | `
104 |

---

## /docs/1.docs/50.database.md:

1 | ---
2 | icon: ri:database-2-line
3 | title: Database
4 | ---
5 |
6 | > Nitro provides a built-in and lightweight SQL database layer.
7 |
8 | ::warning
9 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
10 | ::
11 |
12 | The default database connection is **preconfigured** with [SQLite](https://db0.unjs.io/connectors/sqlite) and works out of the box for development mode and any Node.js compatible production deployments. By default, data will be stored in `.data/db.sqlite`.
13 |
14 | :read-more{to="https://db0.unjs.io" title="DB0 Documentation"}
15 |
16 | > [!IMPORTANT]
17 | > Database support is currently experimental.
18 | > Refer to the [db0 issues](https://github.com/unjs/db0/issues) for status and bug report.
19 |
20 | In order to enable database layer you need to enable experimental feature flag.
21 |
22 | `ts [nitro.config.ts]
23 | import { defineNitroConfig } from "nitro/config";
24 | 
25 | export default defineNitroConfig({
26 |   experimental: {
27 |     database: true
28 |   }
29 | })
30 | `
31 |
32 | > [!TIP]
33 | > You can change default connection or define more connections to any of the [supported databases](https://db0.unjs.io/connectors/sqlite).
34 |
35 | > [!TIP]
36 | > You can integrate database instance to any of the [supported ORMs](https://db0.unjs.io/integrations).
37 |
38 |
39 | ## Usage
40 |
41 | <!-- automd:file code src="../../examples/database/routes/index.ts" -->
42 |
43 | `` ts [index.ts]
44 | export default defineEventHandler(async () => {
45 |   const db = useDatabase();
46 | 
47 |   // Create users table
48 |   await db.sql`DROP TABLE IF EXISTS users`;
49 |   await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY, "firstName" TEXT, "lastName" TEXT, "email" TEXT)`;
50 | 
51 |   // Add a new user
52 |   const userId = String(Math.round(Math.random() * 10_000));
53 |   await db.sql`INSERT INTO users VALUES (${userId}, 'John', 'Doe', '')`;
54 | 
55 |   // Query for users
56 |   const { rows } = await db.sql`SELECT * FROM users WHERE id = ${userId}`;
57 | 
58 |   return {
59 |     rows,
60 |   };
61 | });
62 |  ``
63 |
64 | <!-- /automd -->
65 |
66 | ## Configuration
67 |
68 | You can configure database connections using `database` config:
69 |
70 | `ts [nitro.config.ts]
71 | import { defineNitroConfig } from "nitro/config";
72 | 
73 | export default defineNitroConfig({
74 |   database: {
75 |     default: {
76 |       connector: "sqlite",
77 |       options: { name: "db" }
78 |     },
79 |     users: {
80 |       connector: "postgresql",
81 |       options: {
82 |         url: "postgresql://username:password@hostname:port/database_name"
83 |       },
84 |     },
85 |   },
86 | });
87 | `
88 |
89 | > [!TIP]
90 | > You can use the `devDatabase` config to overwrite the database configuration only for development mode.
91 |

---

## /docs/1.docs/50.lifecycle.md:

1 | ---
2 | icon: i-lucide-layers
3 | ---
4 |
5 | # Lifecycle
6 |
7 | > Understand how Nitro runs and serves incoming requests to your application.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | A request can be intercepted and terminated (with or without a response) from any of these layers, in this order:
14 |
15 | ::steps
16 | <!-- ### Server hook: `request`
 17 |
 18 | This server hook is the first piece of code being called for an incoming request, you can define it within a server plugin:
 19 |
 20 | ```ts [plugins/request-hoook.ts]
 21 | export default (nitroApp) => {
 22 |   nitroApp.hooks.hook('request', ({ req }) => {
 23 |     console.log(`Incoming request on ${req.url}`)
 24 |   })
 25 | }
 26 | ```
 27 |
 28 | ::note
 29 | This hook cannot alter or terminate the incoming request, you can use it for logging the incoming requests or analytics purpose.
 30 | :: -->
31 |
32 | ### Route rules
33 |
34 | The matching route rule defined in the Nitro config will execute. Note that most of the route rules can alter the response without terminating it (for instance, adding a header).
35 |
36 | `ts [nitro.config.ts]
 37 | import { defineNitroConfig } from "nitro/config";
 38 | 
 39 | export default defineNitroConfig({
 40 |   routeRules: {
 41 |     '/**': { headers: { 'x-nitro': 'first' } }
 42 |   }
 43 | })
 44 | `
45 |
46 | :read-more{to="/docs/routing#route-rules" title="Routing > Route rules"}
47 |
48 | ### Global middleware
49 |
50 | Any global middleware defined in the `middleware/` directory will be run:
51 |
52 | `ts [middleware/info.ts]
 53 | import { defineHandler } from "nitro/h3";
 54 | 
 55 | export default defineHandler((event) => {
 56 |   event.context.info = { name: "Nitro" };
 57 | });
 58 | `
59 |
60 | ::warning
61 | Returning from a middleware will close the request and should be avoided when possible.
62 | ::
63 |
64 | ::read-more{to="/docs/middleware"}
65 | Learn more about Nitro middleware.
66 | ::
67 |
68 | ### Server entry
69 |
70 | If defined, the server entry handler will be run:
71 |
72 | `ts [server.ts]
 73 | import { defineHandler } from "nitro/deps/h3";
 74 | 
 75 | export default defineHandler((event) => {
 76 |   if (event.path === "/") {
 77 |     return "Home page";
 78 |   }
 79 | });
 80 | `
81 |
82 | ::tip
83 | Think of the server entry as the last global middleware to run.
84 | ::
85 |
86 | ::read-more{to="/docs/server-entry"}
87 | Learn more about Nitro server entry.
88 | ::
89 |
90 | ### Routes
91 |
92 | At this stage, Nitro will look at defined routes in the `routes/` folder to match the incoming request.
93 |
94 | `ts [routes/api/hello.ts]
 95 | export default (event) => ({ world: true })
 96 | `
97 |
98 | ::read-more{to="/docs/routing#filesystem-routing"}
99 | Learn more about Nitro file-system routing.
100 | ::
101 |
102 | ### Renderer
103 |
104 | If no route is matched, Nitro will look for a renderer handler (defined or auto-detected) to handle the request.
105 |
106 | ::read-more{to="/docs/renderer"}
107 | Learn more about Nitro renderer.
108 | ::
109 |
110 | ::
111 |

---

## /docs/1.docs/50.plugins.md:

1 | ---
2 | icon: ri:plug-line
3 | ---
4 |
5 | # Plugins
6 |
7 | > Use plugins to extend Nitro's runtime behavior.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | Nitro plugins will be **executed once** during server startup in order to allow extending Nitro's runtime behavior.
14 | They receive `nitroApp` context, which can be used to hook into Nitro lifecycle events.
15 |
16 | Plugins are auto-registered from `plugins/` directory and run synchronously (by order of file name) on the first Nitro initialization.
17 |
18 |
19 | **Example:**
20 |
21 | `ts [plugins/test.ts]
 22 | export default defineNitroPlugin((nitroApp) => {
 23 |   console.log('Nitro plugin', nitroApp)
 24 | })
 25 | `
26 |
27 | If you have plugins in another directory, you can use the `plugins` option:
28 |
29 | `ts [nitro.config.ts]
 30 | import { defineNitroConfig } from "nitro/config";
 31 | 
 32 | export default defineNitroConfig({
 33 |   plugins: ['my-plugins/hello.ts']
 34 | })
 35 | `
36 |
37 | ## Nitro runtime hooks
38 |
39 | You can use Nitro [hooks](https://github.com/unjs/hookable) to extend the default runtime behaviour of Nitro by registering custom (async or sync) functions to the lifecycle events within plugins.
40 |
41 | **Example:**
42 |
43 | `ts
 44 | export default defineNitroPlugin((nitro) => {
 45 |   nitro.hooks.hook("close", async () => {
 46 |     // Will run when nitro is being closed
 47 |   });
 48 | })
 49 | `
50 |
51 | ### Available hooks
52 |
53 | See the [source code](https://github.com/nitrojs/nitro/blob/v2/src/core/index.ts#L75) for list of all available runtime hooks.
54 |
55 | - `"close", () => {}`
56 | - `"error", (error, { event? }) => {}`
57 | - `"render:response", (response, { event }) => {}`
58 | - `"request", (event) => {}`
59 | - `"beforeResponse", (event, { body }) => {}`
60 | - `"afterResponse", (event, { body }) => {}`
61 |
62 | ## Examples
63 |
64 | ### Capturing errors
65 |
66 | You can use plugins to capture all application errors.
67 |
68 | `` ts
 69 | export default defineNitroPlugin((nitro) => {
 70 |   nitro.hooks.hook("error", async (error, { event }) => {
 71 |     console.error(`${event.path} Application error:`, error)
 72 |   });
 73 | })
 74 |  ``
75 |
76 | ### Graceful shutdown
77 |
78 | You can use plugins to register a hook that resolves when Nitro is closed.
79 |
80 | `ts
 81 | export default defineNitroPlugin((nitro) => {
 82 |   nitro.hooks.hookOnce("close", async () => {
 83 |     // Will run when nitro is closed
 84 |     console.log("Closing nitro server...")
 85 |     await new Promise((resolve) => setTimeout(resolve, 500));
 86 |     console.log("Task is done!");
 87 |   });
 88 | })
 89 | `
90 |
91 | ### Request and response lifecycle
92 |
93 | You can use plugins to register a hook that can run on request lifecycle:
94 |
95 | `ts
 96 | export default defineNitroPlugin((nitroApp) => {
 97 |   nitroApp.hooks.hook("request", (req) => {
 98 |     console.log("on request", req.url);
 99 |   });
100 | 
101 |   nitroApp.hooks.hook("beforeResponse", (event, { body }) => {
102 |     console.log("on response", event.path, { body });
103 |   });
104 | 
105 |   nitroApp.hooks.hook("afterResponse", (event, { body }) => {
106 |     console.log("on after response", event.path, { body });
107 |   });
108 | });
109 | `
110 |
111 | <!-- ### Renderer response
112 |
113 | You can use plugins to register a hook that modifies the [`renderer`](https://nitro.build/config#renderer) response.
114 |
115 | ::note
116 | This **only works** for render handler defined with [`renderer`](https://nitro.build/config#renderer) and won't be called for other api/server routes.
117 | In [Nuxt](https://nuxt.com/) this hook will be called for Server-side rendered pages
118 | ::
119 |
120 | ```ts
121 | export default defineNitroPlugin((nitro) => {
122 |
123 |   nitro.hooks.hook('render:response', (response, { event }) => {
124 |     // Inspect or Modify the renderer response here
125 |     console.log(response)
126 |   })
127 | })
128 | ``` -->
129 |

---

## /docs/1.docs/50.tasks.md:

1 | ---
2 | icon: codicon:run-all
3 | ---
4 |
5 | # Tasks
6 |
7 | > Nitro tasks allow on-off operations in runtime.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | ## Opt-in to the experimental feature
14 |
15 | > [!IMPORTANT]
16 | > Tasks support is currently experimental.
17 | > See [nitrojs/nitro#1974](https://github.com/nitrojs/nitro/issues/1974) for the relevant discussion.
18 |
19 | In order to use the tasks API you need to enable experimental feature flag.
20 |
21 | `ts [nitro.config.ts]
 22 | import { defineNitroConfig } from "nitro/config";
 23 | 
 24 | export default defineNitroConfig({
 25 |   experimental: {
 26 |     tasks: true
 27 |   }
 28 | })
 29 | `
30 |
31 | ## Define tasks
32 |
33 | Tasks can be defined in `tasks/[name].ts` files.
34 |
35 | Nested directories are supported. The task name will be joined with `:`. (Example: `tasks/db/migrate.ts`task name will be `db:migrate`)
36 |
37 | **Example:**
38 |
39 | `ts [tasks/db/migrate.ts]
 40 | export default defineTask({
 41 |   meta: {
 42 |     name: "db:migrate",
 43 |     description: "Run database migrations",
 44 |   },
 45 |   run({ payload, context }) {
 46 |     console.log("Running DB migration task...");
 47 |     return { result: "Success" };
 48 |   },
 49 | });
 50 | `
51 |
52 | ## Scheduled tasks
53 |
54 | You can define scheduled tasks using Nitro configuration to automatically run after each period of time.
55 |
56 | `` ts [nitro.config.ts]
 57 | import { defineNitroConfig } from "nitro/config";
 58 | 
 59 | export default defineNitroConfig({
 60 |   scheduledTasks: {
 61 |     // Run `cms:update` task every minute
 62 |     '* * * * *': ['cms:update']
 63 |   }
 64 | })
 65 |  ``
66 |
67 | > [!TIP]
68 | > You can use [crontab.guru](https://crontab.guru/) to easily generate and understand cron tab patterns.
69 |
70 | ### Platform support
71 |
72 | - `dev`, `node-server`, `bun` and `deno-server` presets are supported with [croner](https://croner.56k.guru/) engine.
73 | - `cloudflare_module` preset have native integration with [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/). Make sure to configure wrangler to use exactly same patterns you define in `scheduledTasks` to be matched.
74 | - More presets (with native primitives support) are planned to be supported!
75 |
76 | ## Programmatically run tasks
77 |
78 | To manually run tasks, you can use `runTask(name, { payload? })` utility.
79 |
80 | **Example:**
81 |
82 | `ts [api/migrate.ts]
 83 | export default eventHandler(async (event) => {
 84 |   // IMPORTANT: Authenticate user and validate payload!
 85 |   const payload = { ...getQuery(event) };
 86 |   const { result } = await runTask("db:migrate", { payload });
 87 | 
 88 |   return { result };
 89 | });
 90 | `
91 |
92 | ## Run tasks with dev server
93 |
94 | Nitro's built-in dev server exposes tasks to be easily executed without programmatic usage.
95 |
96 | ### Using API routes
97 |
98 | #### `/_nitro/tasks`
99 |
100 | This endpoint returns a list of available task names and their meta.
101 |
102 | `json
103 | // [GET] /_nitro/tasks
104 | {
105 |   "tasks": {
106 |     "db:migrate": {
107 |       "description": "Run database migrations"
108 |     },
109 |      "cms:update": {
110 |       "description": "Update CMS content"
111 |     }
112 |   },
113 |   "scheduledTasks": [
114 |     {
115 |       "cron": "* * * * *",
116 |       "tasks": [
117 |         "cms:update"
118 |       ]
119 |     }
120 |   ]
121 | }
122 | `
123 |
124 | #### `/_nitro/tasks/:name`
125 |
126 | This endpoint executes a task. You can provide a payload using both query parameters and body JSON payload. The payload sent in the JSON body payload must be under the `"payload"` property.
127 |
128 | ::code-group
129 | `ts [tasks/echo/payload.ts]
130 | export default defineTask({
131 |   meta: {
132 |     name: "echo:payload",
133 |     description: "Returns the provided payload",
134 |   },
135 |   run({ payload, context }) {
136 |     console.log("Running echo task...");
137 |     return { result: payload };
138 |   },
139 | });
140 | `
141 | `json [GET]
142 | // [GET] /_nitro/tasks/echo:payload?field=value&array=1&array=2
143 | {
144 |   "field": "value",
145 |   "array": ["1", "2"]
146 | }
147 | `
148 | `json [POST]
149 | /**
150 |  * [POST] /_nitro/tasks/echo:payload?field=value
151 |  * body: {
152 |  *   "payload": {
153 |  *     "answer": 42,
154 |  *     "nested": {
155 |  *       "value": true
156 |  *     }
157 |  *   }
158 |  * }
159 |  */
160 | {
161 |   "field": "value",
162 |   "answer": 42,
163 |   "nested": {
164 |     "value": true
165 |   }
166 | }
167 | `
168 | ::
169 |
170 | > [!NOTE]
171 | > The JSON payload included in the body will overwrite the keys present in the query params.
172 |
173 | ### Using CLI
174 |
175 | > [!IMPORTANT]
176 | > It is only possible to run these commands while the **dev server is running**. You should run them in a second terminal.
177 |
178 | #### List tasks
179 |
180 | `sh
181 | nitro task list
182 | `
183 |
184 | #### Run a task
185 |
186 | `sh
187 | nitro task run db:migrate --payload "{}"
188 | `
189 |
190 | ## Notes
191 |
192 | ### Concurrency
193 |
194 | Each task can have **one running instance**. Calling a task of same name multiple times in parallel, results in calling it once and all callers will get the same return value.
195 |
196 | > [!NOTE]
197 | > Nitro tasks can be running multiple times and in parallel.
198 |

---

## /docs/1.docs/6.server-entry.md:

1 | ---
2 | icon: ri:server-line
3 | navigation:
4 | title: Server Entry
5 | ---
6 |
7 | # Nitro Server Entry
8 |
9 | > Use a server entry to create a global middleware that runs for all routes before they are matched.
10 |
11 | ::warning
12 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
13 | ::
14 |
15 | The server entry is a special handler in Nitro that acts as a global middleware, running for every incoming request before routes are matched (see [request lifecycle](/docs/architecture#request-lifecycle)). It's commonly used for cross-cutting concerns like authentication, logging, request preprocessing, or creating custom routing logic.
16 |
17 | ## Auto-detected `server.ts`
18 |
19 | By default, Nitro automatically looks for a `server.ts` (or `.js`, `.mjs`, `.tsx`, etc.) file in your project root or scan directories.
20 |
21 | If found, Nitro will use it as the server entry and run it for all incoming requests.
22 |
23 | ::code-group
24 | `ts [server.ts]
 25 | export default {
 26 |   async fetch(req: Request) {
 27 |     const url = new URL(req.url);
 28 | 
 29 |     // Handle specific routes
 30 |     if (url.pathname === "/health") {
 31 |       return new Response("OK", {
 32 |         status: 200,
 33 |         headers: { "content-type": "text/plain" }
 34 |       });
 35 |     }
 36 | 
 37 |     // Add custom headers to all requests
 38 |     // Return nothing to continue to the next handler
 39 |   }
 40 | }
 41 | `
42 | `ts [routes/api/hello.ts]
 43 | import { defineHandler } from "nitro/h3";
 44 | 
 45 | export default defineHandler((event) => {
 46 |   return { hello: "API" };
 47 | });
 48 | `
49 | ::
50 |
51 | ::tip
52 | When `server.ts` is detected, Nitro will automatically log in the terminal: `Using \`server.ts\` as server entry.` 53 | ::
 54 | 
 55 | With this setup:
 56 | -`/health`→ Handled by server entry
 57 | -`/api/hello`→ Server entry runs first, then the API route
 58 | -`/about` , etc. → Server entry runs first, then continues to routes or renderer
 59 | 
 60 | ## Framework compatibility
 61 | 
 62 | The server entry is a great way to integrate with other frameworks such as [Elysia](https://elysiajs.com/), [Hono](https://hono.dev/) or [H3](https://h3.dev/).
 63 | 
 64 | ::tabs
 65 |   ::tabs-item{label="H3" icon="i-undocs-h3"}
 66 |   ```ts [server.ts]
 67 |   import { H3 } from "h3";
 68 | 
 69 |   const app = new H3()
 70 | 
 71 |   app.get("/", () => "⚡️ Hello from H3!");
 72 | 
 73 |   export default app;
 74 |   ```
 75 |   ::
 76 |   ::tabs-item{label="Hono" icon="i-undocs-hono"}
 77 |   ```ts [server.ts]
 78 |   import { Hono } from "hono";
 79 | 
 80 |   const app = new Hono();
 81 | 
 82 |   app.get("/", (c) => c.text("🔥 Hello from Hono!"));
 83 | 
 84 |   export default app;
 85 |   ```
 86 |   ::
 87 |   ::tabs-item{label="Elysia" icon="i-undocs-elysia"}
 88 |   ```ts [server.ts]
 89 |   import { Elysia } from "elysia";
 90 | 
 91 |   const app = new Elysia();
 92 | 
 93 |   app.get("/", (c) => "🦊 Hello from Elysia!");
 94 | 
 95 |   export default app;
 96 |   ```
 97 |   ::
 98 | ::
 99 | 
100 | 
101 | ## Custom server entry file
102 | 
103 | You can specify a custom server entry file using the  `serverEntry` option in your Nitro configuration.
104 | 
105 | ```ts [nitro.config.ts]
106 | import { defineNitroConfig } from 'nitro/config'
107 | 
108 | export default defineNitroConfig({
109 |   serverEntry: './nitro.server.ts'
110 | })
111 | ```
112 | 
113 | ## Using event handler
114 | 
115 | You can also export an event handler using `defineHandler` for better type inference and access to the h3 event object:
116 | 
117 | ```ts [server.ts]
118 | import { defineHandler } from "nitro/h3";
119 | 
120 | export default defineHandler((event) => {
121 |   // Add custom context
122 |   event.context.requestId = crypto.randomUUID();
123 |   event.context.timestamp = Date.now();
124 | 
125 |   // Log the request
126 |   console.log(`[${event.context.requestId}] ${event.method} ${event.path}` );
127 | 
128 |   // Continue to the next handler (don't return anything)
129 | });
130 | ```
131 | 
132 | ::important
133 | If your server entry returns  `undefined` or doesn't return anything, the request will continue to be processed by routes and the renderer. If it returns a response, the request lifecycle stops there.
134 | ::
135 | 
136 | ## Request lifecycle
137 | 
138 | The server entry is called as part of the global middleware stack, after route rules but before route handlers:
139 | 
140 | ```md
141 | 1. Server hook: `request` 142 | 2. Route rules (headers, redirects, etc.)
143 | 3. Global middleware (middleware/)
144 | 4. Server entry ← You are here
145 | 5. Routes (routes/)
146 | 6. Renderer (renderer.ts or index.html)
147 | ```
148 | 
149 | Think of the server entry as the **last global middleware** to run before route matching.
150 | 
151 | :read-more{to="/docs/architecture#request-lifecycle" title="Architecture > Request lifecycle"}
152 | 
153 | ## Best practices
154 | 
155 | - Use server entry for cross-cutting concerns that affect **all routes**
156 | - Return `undefined` to continue processing, return a response to terminate
157 | - Keep server entry logic lightweight for better performance
158 | - Use global middleware for modular concerns instead of one large server entry
159 | - Consider using [Nitro plugins](/docs/plugins) for initialization logic
160 | - Avoid heavy computation in server entry (it runs for every request)
161 | - Don't use server entry for route-specific logic (use route handlers instead as they are more performant)
162 |
163 |

---

## /docs/1.docs/7.cache.md:

1 | ---
2 | icon: ri:speed-line
3 | ---
4 |
5 | # Cache
6 |
7 | > Nitro provides a caching system built on top of the storage layer.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | ## Cached handlers
14 |
15 | To cache an event handler, you simply need to use the `defineCachedHandler` method.
16 |
17 | It works like `defineHandler` but with an second parameter for the [cache options](#options).
18 |
19 | `ts [routes/cached.ts]
 20 | import { defineCachedHandler } from "nitro/runtime";
 21 | 
 22 | export default defineCachedHandler((event) => {
 23 |   return "I am cached for an hour";
 24 | }, { maxAge: 60 * 60 });
 25 | `
26 |
27 | With this example, the response will be cached for 1 hour and a stale value will be sent to the client while the cache is being updated in the background. If you want to immediately return the updated response set `swr: false`.
28 |
29 | See the [options](#options) section for more details about the available options.
30 |
31 |
32 | ::important
33 | **Request headers are dropped** when handling cached responses. Use the [`varies` option](#options) to consider specific headers when caching and serving the responses.
34 | ::
35 |
36 | ## Cached functions
37 |
38 | You can also cache a function using the `defineCachedFunction` function. This is useful for caching the result of a function that is not an event handler, but is part of one, and reusing it in multiple handlers.
39 |
40 | For example, you might want to cache the result of an API call for one hour:
41 |
42 | `` ts [routes/api/stars/[...repo\\].ts]
 43 | import { defineHandler, defineCachedFunction } from "nitro/runtime";
 44 | 
 45 | export default defineHandler(async (event) => {
 46 |   const { repo } = event.context.params;
 47 |   const stars = await cachedGHStars(repo).catch(() => 0)
 48 | 
 49 |   return { repo, stars }
 50 | });
 51 | 
 52 | const cachedGHStars = defineCachedFunction(async (repo: string) => {
 53 |   const data = await fetch(`https://api.github.com/repos/${repo}`).then(res => res.json());
 54 | 
 55 |   return data.stargazers_count;
 56 | }, {
 57 |   maxAge: 60 * 60,
 58 |   name: "ghStars",
 59 |   getKey: (repo: string) => repo
 60 | });
 61 |  ``
62 |
63 | The stars will be cached in development inside `.nitro/cache/functions/ghStars/<owner>/<repo>.json` with `value` being the number of stars.
64 |
65 | `json
 66 | {"expires":1677851092249,"value":43991,"mtime":1677847492540,"integrity":"ZUHcsxCWEH"}
 67 | `
68 |
69 | ::important
70 | Because the cached data is serialized to JSON, it is important that the cached function does not return anything that cannot be serialized, such as Symbols, Maps, Sets…
71 | ::
72 |
73 | ::callout
74 | If you are using edge workers to host your application, you should follow the instructions below.
75 | ::collapsible{name="Edge workers instructions"}
76 | In edge workers, the instance is destroyed after each request. Nitro automatically uses `event.waitUntil` to keep the instance alive while the cache is being updated while the response is sent to the client.
77 |
78 | To ensure that your cached functions work as expected in edge workers, **you should always pass the `event` as the first argument to the function using `defineCachedFunction`.**
79 |
80 | `` ts [routes/api/stars/[...repo\\].ts] {5,10,17}
 81 |   import { defineHandler, defineCachedFunction, type H3Event } from "nitro/runtime";
 82 | 
 83 |   export default defineHandler(async (event) => {
 84 |     const { repo } = event.context.params;
 85 |     const stars = await cachedGHStars(event, repo).catch(() => 0)
 86 | 
 87 |     return { repo, stars }
 88 |   });
 89 | 
 90 |   const cachedGHStars = defineCachedFunction(async (event: H3Event, repo: string) => {
 91 |     const data = await fetch(`https://api.github.com/repos/${repo}`).then(res => res.json());
 92 | 
 93 |     return data.stargazers_count;
 94 |   }, {
 95 |     maxAge: 60 * 60,
 96 |     name: "ghStars",
 97 |     getKey: (event: H3Event, repo: string) => repo
 98 |   });
 99 |    ``
100 |
101 | This way, the function will be able to keep the instance alive while the cache is being updated without slowing down the response to the client.
102 | ::
103 | ::
104 |
105 | ## Using route rules
106 |
107 | This feature enables you to add caching routes based on a glob pattern directly in the main configuration file. This is especially useful to have a global cache strategy for a part of your application.
108 |
109 | Cache all the blog routes for 1 hour with `stale-while-revalidate` behavior:
110 |
111 | `ts [nitro.config.ts]
112 | import { defineNitroConfig } from "nitro/config";
113 | 
114 | export default defineNitroConfig({
115 |   routeRules: {
116 |     "/blog/**": { cache: { maxAge: 60 * 60 } },
117 |   },
118 | });
119 | `
120 |
121 | If we want to use a [custom cache storage](#cache-storage) mount point, we can use the `base` option.
122 |
123 | `ts [nitro.config.ts]
124 | import { defineNitroConfig } from "nitro/config";
125 | 
126 | export default defineNitroConfig({
127 |   storage: {
128 |     redis: {
129 |       driver: "redis",
130 |       url: "redis://localhost:6379",
131 |     },
132 |   },
133 |   routeRules: {
134 |     "/blog/**": { cache: { maxAge: 60 * 60, base: "redis" } },
135 |   },
136 | });
137 | `
138 |
139 | ## Cache storage
140 |
141 | Nitro stores the data in the `cache` storage mount point.
142 |
143 | - In production, it will use the [memory driver](https://unstorage.unjs.io/drivers/memory) by default.
144 | - In development, it will use the [filesystem driver](https://unstorage.unjs.io/drivers/fs), writing to a temporary dir (`.nitro/cache`).
145 |
146 | To overwrite the production storage, set the `cache` mount point using the `storage` option:
147 |
148 | `ts [nitro.config.ts]
149 | import { defineNitroConfig } from "nitro/config";
150 | 
151 | export default defineNitroConfig({
152 |   storage: {
153 |     cache: {
154 |       driver: 'redis',
155 |       /* redis connector options */
156 |     }
157 |   }
158 | })
159 | `
160 |
161 | In development, you can also overwrite the cache mount point using the `devStorage` option:
162 |
163 | `ts [nitro.config.ts]
164 | import { defineNitroConfig } from "nitro/config";
165 | 
166 | export default defineNitroConfig({
167 |   storage: {
168 |     cache: {
169 |       // production cache storage
170 |     },
171 |   },
172 |   devStorage: {
173 |     cache: {
174 |       // development cache storage
175 |     }
176 |   }
177 | })
178 | `
179 |
180 | ## Options
181 |
182 | The `defineCachedHandler` and `defineCachedFunction` functions accept the following options:
183 |
184 | ::field-group
185 | ::field{name="base" type="string"}
186 | Name of the storage mountpoint to use for caching. :br
187 | Default to `cache`.
188 | ::
189 | ::field{name="name" type="string"}
190 | Guessed from function name if not provided, and falls back to `'_'` otherwise.
191 | ::
192 | ::field{name="group" type="string"}
193 | Defaults to `'nitro/handlers'` for handlers and `'nitro/functions'` for functions.
194 | ::
195 | ::field{name="getKey()" type="(...args) => string"}
196 | A function that accepts the same arguments as the original function and returns a cache key (`String`). :br
197 | If not provided, a built-in hash function will be used to generate a key based on the function arguments.
198 | ::
199 | ::field{name="integrity" type="string"}
200 | A value that invalidates the cache when changed. :br
201 | By default, it is computed from **function code**, used in development to invalidate the cache when the function code changes.
202 | ::
203 | ::field{name="maxAge" type="number"}
204 | Maximum age that cache is valid, in seconds. :br
205 | Default to `1` (second).
206 | ::
207 | ::field{name="staleMaxAge" type="number"}
208 | Maximum age that a stale cache is valid, in seconds. If set to `-1` a stale value will still be sent to the client while the cache updates in the background. :br
209 | Defaults to `0` (disabled).
210 | ::
211 | ::field{name="swr" type="boolean"}
212 | Enable `stale-while-revalidate` behavior to serve a stale cached response while asynchronously revalidating it. :br
213 | Defaults to `true`.
214 | ::
215 | ::field{name="shouldInvalidateCache()" type="(..args) => boolean"}
216 | A function that returns a `boolean` to invalidate the current cache and create a new one.
217 | ::
218 | ::field{name="shouldBypassCache()" type="(..args) => boolean"}
219 | A function that returns a `boolean` to bypass the current cache without invalidating the existing entry.
220 | ::
221 | ::field{name="varies" type="string[]"}
222 | An array of request headers to be considered for the cache, [learn more](https://github.com/nitrojs/nitro/issues/1031). If utilizing in a multi-tenant environment, you may want to pass `['host', 'x-forwarded-host']` to ensure these headers are not discarded and that the cache is unique per tenant.
223 | ::
224 | ::
225 |
226 | ## Cache keys and invalidation
227 |
228 | When using the `defineCachedFunction` or `defineCachedHandler` functions, the cache key is generated using the following pattern:
229 |
230 | `` ts
231 | `${options.group}:${options.name}:${options.getKey(...args)}.json`
232 |  ``
233 |
234 | For example, the following function:
235 |
236 | `ts
237 | import { defineCachedFunction } from "nitro/runtime";
238 | 
239 | const getAccessToken = defineCachedFunction(() => {
240 |   return String(Date.now())
241 | }, {
242 |   maxAge: 10,
243 |   name: "getAccessToken",
244 |   getKey: () => "default"
245 | });
246 | `
247 |
248 | Will generate the following cache key:
249 |
250 | `ts
251 | nitro:functions:getAccessToken:default.json
252 | `
253 |
254 | You can invalidate the cached function entry with:
255 |
256 | `ts
257 | import { useStorage } from "nitro/runtime";
258 | 
259 | await useStorage('cache').removeItem('nitro:functions:getAccessToken:default.json')
260 | `
261 |
262 | ::read-more{to="/docs/storage"}
263 | Read more about the Nitro storage.
264 | ::
265 |

---

## /docs/1.docs/8.storage.md:

1 | ---
2 | icon: carbon:datastore
3 | ---
4 |
5 | # KV Storage
6 |
7 | > Nitro provides a built-in storage layer that can abstract filesystem or database or any other data source.
8 |
9 | ::warning
10 | Nitro v3 Alpha docs are a work in progress — expect updates, rough edges, and occasional inaccuracies.
11 | ::
12 |
13 | Nitro has built-in integration with [unstorage](https://unstorage.unjs.io) to provide a runtime agnostic persistent layer.
14 |
15 | ## Usage
16 |
17 | To use the storage layer, you can use the `useStorage()` and call `get(key)` to retrieve an item and `set(key, value)` to set an item.
18 |
19 | `ts
 20 | import { useStorage } from "nitro/runtime";
 21 | 
 22 | // Default storage is in memory
 23 | await useStorage().set("test:foo", { hello: "world" })
 24 | await useStorage().get("test:foo")
 25 | 
 26 | // You can use data storage to write data to default .data/kv directory
 27 | const dataStorage = useStorage("data")
 28 | await dataStorage.set("test", "works")
 29 | await dataStorage.get("data:test") // Value persists
 30 | 
 31 | // You can also specify the base in useStorage(base)
 32 | await useStorage("test").set("foo", { hello: "world" })
 33 | 
 34 | // You can use generics to define types
 35 | await useStorage<{ hello: string }>("test").get("foo")
 36 | await useStorage("test").get<{ hello: string }>("foo")
 37 | `
38 |
39 | :read-more{to="https://unstorage.unjs.io"}
40 |
41 | ## Configuration
42 |
43 | You can mount one or multiple custom storage drivers using the `storage` option.
44 |
45 | The key is the mount point name, and the value is the driver name and configuration.
46 |
47 | `ts [nitro.config.ts]
 48 | import { defineNitroConfig } from "nitro/config";
 49 | 
 50 | export default defineNitroConfig({
 51 |   storage: {
 52 |     redis: {
 53 |       driver: "redis",
 54 |       /* redis connector options */
 55 |     }
 56 |   }
 57 | })
 58 | `
59 |
60 | Then, you can use the redis storage using the `useStorage("redis")` function.
61 |
62 | ::read-more{to="https://unstorage.unjs.io/"}
63 | You can find the driver list on [unstorage documentation](https://unstorage.unjs.io/) with their configuration.
64 | ::
65 |
66 | ## Development-only storage
67 |
68 | By default, Nitro will mount the project directory and some other directories using the filesystem driver in development.
69 |
70 | `js
 71 | // Access to project root dir
 72 | const rootStorage = useStorage('root')
 73 | 
 74 | // Access to project src dir (same as root by default)
 75 | const srcStorage = useStorage('src')
 76 | 
 77 | // Access to server cache dir
 78 | const cacheStorage = useStorage('cache')
 79 | 
 80 | // Access to the temp build dir
 81 | const buildStorage = useStorage('build')
 82 | `
83 |
84 | > [!TIP]
85 | > You also can use the `devStorage` key to overwrite the storage configuration during development. This is very useful when you use a database in production and want to use the filesystem in development.
86 |
87 | In order to use the `devStorage` key, you need to use the `nitro dev` command and the key in the `storage` option must be the same as the production one.
88 |
89 | `ts [nitro.config.ts]
 90 | import { defineNitroConfig } from "nitro/config";
 91 | 
 92 | export default defineNitroConfig({
 93 |   // Production
 94 |   storage: {
 95 |     default: {
 96 |       driver: 'redis',
 97 |       /* redis connector options */
 98 |     }
 99 |   },
100 |   // Development
101 |   devStorage: {
102 |     default: {
103 |       driver: 'fs',
104 |       base: './data/kv'
105 |     }
106 |   }
107 | })
108 | `
109 |
110 | ## Runtime configuration
111 |
112 | In scenarios where the mount point configuration is not known until runtime, Nitro can dynamically add mount points during startup using [plugins](/docs/plugins).
113 |
114 | `ts [plugins/storage.ts]
115 | import { defineNitroPlugin, useStorage } from "nitro/runtime";
116 | import redisDriver from "unstorage/drivers/redis";
117 | 
118 | export default defineNitroPlugin(() => {
119 |   const storage = useStorage()
120 | 
121 |   // Dynamically pass in credentials from runtime configuration, or other sources
122 |   const driver = redisDriver({
123 |     base: "redis",
124 |     host: process.env.REDIS_HOST,
125 |     port: process.env.REDIS_PORT,
126 |     /* other redis connector options */
127 |   })
128 | 
129 |   // Mount driver
130 |   storage.mount("redis", driver)
131 | })
132 | `
133 |
134 | ::warning
135 | This is a temporary workaround, with a better solution coming in the future! Keep a lookout on the GitHub issue [here](https://github.com/nitrojs/nitro/issues/1161#issuecomment-1511444675).
136 | ::
137 |

---

## /docs/1.docs/99.migration.md:

1 | ---
2 | icon: ri:arrow-right-up-line
3 | ---
4 |
5 | # Migration Guide
6 |
7 | > [!NOTE]
8 | > This is a living document for migrating from Nitro 2 to 3. Please check it regularly while using the beta version.
9 |
10 | Nitro v3 introduces intentional backward-incompatible changes. This guide helps you migrate from Nitro v2.
11 |
12 | ## `nitropack` is renamed to `nitro`
13 |
14 | The NPM package [nitropack](https://www.npmjs.com/package/nitropack) (v2) has been renamed to [nitro](https://www.npmjs.com/package/nitro) (v3).
15 |
16 | **Migration:** Update the `nitropack` dependency to `nitro` in `package.json`:
17 |
18 | `diff [release channel]
 19 | {
 20 |   "dependencies": {
 21 | --    "nitropack": "latest"
 22 | ++    "nitro": "latest"
 23 |   }
 24 | }
 25 | `
26 | `diff [nightly channel]
 27 | {
 28 |   "dependencies": {
 29 | --    "nitropack": "latest"
 30 | ++    "nitro": "npm:nitro-nightly"
 31 |   }
 32 | }
 33 | `
34 |
35 | **Migration:** Search your codebase and rename all instances of nitropack to nitro:
36 |
37 | `diff
 38 | -- import { defineNitroConfig } from "nitropack/config"
 39 | ++ import { defineNitroConfig } from "nitro/config"
 40 | `
41 |
42 | ## nitro/runtime/_
43 |
44 | Previously, you could import from both `nitro/runtime` and `nitro/runtime/_` .
 45 | 
 46 | Support for nested paths has been removed to prevent exposing Nitro internals.
 47 | 
 48 | **Migration:** Search for nitro/runtime/ imports and replace them with nitro/runtime:
 49 | 
 50 | ```diff
 51 | -- import { useStorage } from "nitropack/runtime/storage"
 52 | ++ import { useStorage } from "nitro/runtime"
 53 | ```
 54 | 
 55 | ## Minimum Supported Node.js Version: 20
 56 | 
 57 | Nitro now requires a minimum Node.js version of 20, as Node.js 18 reaches end-of-life in [April 2025](https://nodejs.org/en/about/previous-releases).
 58 | 
 59 | Please upgrade to the [latest LTS](https://nodejs.org/en/download) version (>= 20).
 60 | 
 61 | **Migration:**
 62 | 
 63 | - Check your local Node.js version using  `node --version`and update if necessary.
 64 | - If you use a CI/CD system for deployment, ensure that your pipeline is running Node.js 20 or higher.
 65 | - If your hosting provider manages the Node.js runtime, make sure it’s set to version 20, 22, or later.
 66 | 
 67 | ## Type Imports
 68 | 
 69 | Nitro types are now only exported from`nitro/types` .
 70 | 
 71 | **Migration:** Import types from nitro/types instead of nitro:
 72 | 
 73 | ```diff
 74 | -- import { NitroRuntimeConfig } from "nitropack"
 75 | ++ import { NitroRuntimeConfig } from "nitro/types"
 76 | ```
 77 | 
 78 | ## App Config Support Removed
 79 | 
 80 | Nitro v2 supported a bundled app config that allowed defining configurations in  `app.config.ts`and accessing them at runtime via`useAppConfig()`.
 81 | 
 82 | This feature had been removed.
 83 | 
 84 | **Migration:**
 85 | 
 86 | Use a regular `.ts`file in your server directory and import it directly.
 87 | 
 88 | ## Preset updates
 89 | 
 90 | Nitro presets have been updated for the latest compatibility.
 91 | 
 92 | Some (legacy) presets have been removed or renamed.
 93 | 
 94 | | Old Preset                   | New Preset                    |
 95 | |------------------------------|-------------------------------|
 96 | |`node`                      |`node-middleware`(export changed to`middleware`) |
 97 | | `cloudflare`, `cloudflare_worker`, `cloudflare_module_legacy`|`cloudflare_module`          |
 98 | |`deno-server-legacy`        |`deno_server`with Deno v2    |
 99 | |`netlify-builder`           |`netlify_functions`or`netlify_edge`|
100 | |`vercel-edge`               |`vercel`with Fluid compute enabled |
101 | |`azure`, `azure_functions`  |`azure_swa`                  |
102 | |`firebase`                  |`firebase-functions`         |
103 | |`iis`                       |`iis-handler`                |
104 | |`deno`                      |`deno-deploy`                |
105 | |`edgio`                     | Discontinued     |
106 | |`cli`                       | Removed due to lack of use |
107 | |`service_worker`            | Removed due to instability |
108 | |`firebase`                  | Use new firebase app hosting |
109 | 
110 | ## Removed Subpath Exports
111 | 
112 | Nitro v2 introduced multiple subpath exports, some of which have been removed:
113 | 
114 | -`nitropack/core`(use`nitro`)
115 | - `nitropack/runtime/_`116 | -`nitropack/dist/runtime/_`117 | -`nitropack/presets/\*`118 | -`nitro/rollup`119 | -`nitropack/kit`120 | 
121 | An experimental`nitropack/kit`was introduced but has now been removed. A standalone Nitro Kit package may be introduced in the future with clearer objectives.
122 | 
123 | **Migration:**
124 | 
125 | - Use`NitroModule`from`nitro/types`instead of`defineNitroModule` from the kit.
126 | - Prefer built-in Nitro presets (external presets are only for evaluation purposes).
127 |

---

## /docs/1.docs/99.nightly.md:

1 | ---
2 | icon: ri:moon-fill
3 | ---
4 |
5 | # Nightly Channel
6 |
7 | > Nitro has a nightly release channel that automatically releases for every commit to `main` branch to try latest changes.
8 |
9 | You can opt-in to the nightly release channel by updating your `package.json`:
10 |
11 | `json
12 | {
13 |   "devDependencies": {
14 |     "nitro": "npm:nitro-nightly@latest"
15 |   }
16 | }
17 | `
18 |
19 | Remove the lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`, or `bun.lockb`) and reinstall the dependencies.
20 |

---

# Environment API

:::info Release Candidate
The Environment API is generally in the release candidate phase. We'll maintain stability in the APIs between major releases to allow the ecosystem to experiment and build upon them. However, note that [some specific APIs](/changes/#considering) are still considered experimental.

We plan to stabilize these new APIs (with potential breaking changes) in a future major release once downstream projects have had time to experiment with the new features and validate them.

Resources:

-   [Feedback discussion](https://github.com/vitejs/vite/discussions/16358) where we are gathering feedback about the new APIs.
-   [Environment API PR](https://github.com/vitejs/vite/pull/16471) where the new API were implemented and reviewed.

Please share your feedback with us.
:::

## Formalizing Environments

Vite 6 formalizes the concept of Environments. Until Vite 5, there were two implicit Environments (`client`, and optionally `ssr`). The new Environment API allows users and framework authors to create as many environments as needed to map the way their apps work in production. This new capability required a big internal refactoring, but a lot of effort has been placed on backward compatibility. The initial goal of Vite 6 is to move the ecosystem to the new major as smoothly as possible, delaying the adoption of the APIs until enough users have migrated and frameworks and plugin authors have validated the new design.

## Closing the Gap Between Build and Dev

For a simple SPA/MPA, no new APIs around environments are exposed to the config. Internally, Vite will apply the options to a `client` environment, but it's not necessary to know of this concept when configuring Vite. The config and behavior from Vite 5 should work seamlessly here.

When we move to a typical server-side rendered (SSR) app, we'll have two environments:

-   `client`: runs the app in the browser.
-   `ssr`: runs the app in node (or other server runtimes) which renders pages before sending them to the browser.

In dev, Vite executes the server code in the same Node process as the Vite dev server, giving a close approximation to the production environment. However, it is also possible for servers to run in other JS runtimes, like [Cloudflare's workerd](https://github.com/cloudflare/workerd) which have different constraints. Modern apps may also run in more than two environments, e.g. a browser, a node server, and an edge server. Vite 5 didn't allow to properly represent these environments.

Vite 6 allows users to configure their app during build and dev to map all of its environments. During dev, a single Vite dev server can now be used to run code in multiple different environments concurrently. The app source code is still transformed by Vite dev server. On top of the shared HTTP server, middlewares, resolved config, and plugins pipeline, the Vite dev server now has a set of independent dev environments. Each of them is configured to match the production environment as closely as possible, and is connected to a dev runtime where the code is executed (for workerd, the server code can now run in miniflare locally). In the client, the browser imports and executes the code. In other environments, a module runner fetches and evaluates the transformed code.

![Vite Environments](../images/vite-environments.svg)

## Environments Configuration

For an SPA/MPA, the configuration will look similar to Vite 5. Internally these options are used to configure the `client` environment.

```js
export default defineConfig({
    build: {
        sourcemap: false,
    },
    optimizeDeps: {
        include: ["lib"],
    },
});
```

This is important because we'd like to keep Vite approachable and avoid exposing new concepts until they are needed.

If the app is composed of several environments, then these environments can be configured explicitly with the `environments` config option.

```js
export default {
    build: {
        sourcemap: false,
    },
    optimizeDeps: {
        include: ["lib"],
    },
    environments: {
        server: {},
        edge: {
            resolve: {
                noExternal: true,
            },
        },
    },
};
```

When not explicitly documented, environment inherits the configured top-level config options (for example, the new `server` and `edge` environments will inherit the `build.sourcemap: false` option). A small number of top-level options, like `optimizeDeps`, only apply to the `client` environment, as they don't work well when applied as a default to server environments. Those options have <NonInheritBadge /> badge in [the reference](/config/). The `client` environment can also be configured explicitly through `environments.client`, but we recommend to do it with the top-level options so the client config remains unchanged when adding new environments.

The `EnvironmentOptions` interface exposes all the per-environment options. There are environment options that apply to both `build` and `dev`, like `resolve`. And there are `DevEnvironmentOptions` and `BuildEnvironmentOptions` for dev and build specific options (like `dev.warmup` or `build.outDir`). Some options like `optimizeDeps` only applies to dev, but is kept as top level instead of nested in `dev` for backward compatibility.

```ts
interface EnvironmentOptions {
    define?: Record<string, any>;
    resolve?: EnvironmentResolveOptions;
    optimizeDeps: DepOptimizationOptions;
    consumer?: "client" | "server";
    dev: DevOptions;
    build: BuildOptions;
}
```

The `UserConfig` interface extends from the `EnvironmentOptions` interface, allowing to configure the client and defaults for other environments, configured through the `environments` option. The `client` and a server environment named `ssr` are always present during dev. This allows backward compatibility with `server.ssrLoadModule(url)` and `server.moduleGraph`. During build, the `client` environment is always present, and the `ssr` environment is only present if it is explicitly configured (using `environments.ssr` or for backward compatibility `build.ssr`). An app doesn't need to use the `ssr` name for its SSR environment, it could name it `server` for example.

```ts
interface UserConfig extends EnvironmentOptions {
    environments: Record<string, EnvironmentOptions>;
    // other options
}
```

Note that the `ssr` top-level property is going to be deprecated once the Environment API is stable. This option has the same role as `environments`, but for the default `ssr` environment and only allowed configuring of a small set of options.

## Custom Environment Instances

Low level configuration APIs are available so runtime providers can provide environments with proper defaults for their runtimes. These environments can also spawn other processes or threads to run the modules during dev in a closer runtime to the production environment.

```js
import { customEnvironment } from "vite-environment-provider";

export default {
    build: {
        outDir: "/dist/client",
    },
    environments: {
        ssr: customEnvironment({
            build: {
                outDir: "/dist/ssr",
            },
        }),
    },
};
```

## Backward Compatibility

The current Vite server API is not yet deprecated and is backward compatible with Vite 5.

The `server.moduleGraph` returns a mixed view of the client and ssr module graphs. Backward compatible mixed module nodes will be returned from all its methods. The same scheme is used for the module nodes passed to `handleHotUpdate`.

We don't recommend switching to Environment API yet. We are aiming for a good portion of the user base to adopt Vite 6 before so plugins don't need to maintain two versions. Checkout the future breaking changes section for information on future deprecations and upgrade path:

-   [`this.environment` in Hooks](/changes/this-environment-in-hooks)
-   [HMR `hotUpdate` Plugin Hook](/changes/hotupdate-hook)
-   [Move to Per-environment APIs](/changes/per-environment-apis)
-   [SSR Using `ModuleRunner` API](/changes/ssr-using-modulerunner)
-   [Shared Plugins During Build](/changes/shared-plugins-during-build)

## Target Users

This guide provides the basic concepts about environments for end users.

Plugin authors have a more consistent API available to interact with the current environment configuration. If you're building on top of Vite, the [Environment API Plugins Guide](./api-environment-plugins.md) guide describes the way extended plugin APIs available to support multiple custom environments.

Frameworks could decide to expose environments at different levels. If you're a framework author, continue reading the [Environment API Frameworks Guide](./api-environment-frameworks) to learn about the Environment API programmatic side.

For Runtime providers, the [Environment API Runtimes Guide](./api-environment-runtimes.md) explains how to offer custom environment to be consumed by frameworks and users.
