import { createRoot } from "@remix-run/dom";
import { App } from "./App";

// biome-ignore lint/style/noNonNullAssertion: <div id="app"> exists
createRoot(document.getElementById("app")!).render(<App />);
