import { createRoot } from "@remix-run/dom";
import { App } from "./app.tsx";
import "./reset.css";

createRoot(document.body).render(<App />);
