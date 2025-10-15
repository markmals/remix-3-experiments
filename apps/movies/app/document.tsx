import type { Remix } from "@remix-run/dom";
import entryBrowserUrl from "~/assets/entry.browser.tsx?url";
import styles from "~/styles/index.css?url";
import { cssvar as $ } from "./utils/css-var.ts";

export function Document({
	title,
	children,
}: {
	title: string;
	children?: Remix.RemixNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta content="width=device-width, initial-scale=1.0" name="viewport" />
				<title>{title}</title>
				{import.meta.dev ? <script src="/@vite/client" type="module" /> : null}
				<link href={styles} rel="stylesheet" />
				<link href="https://fonts.googleapis.com" rel="preconnect" />
				<link
					crossOrigin="anonymous"
					href="https://fonts.gstatic.com"
					rel="preconnect"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
					rel="stylesheet"
				/>
				<script async src={entryBrowserUrl} type="module" />
			</head>
			<body
				css={{
					minHeight: "100vh",
					fontFamily: `"Space Grotesk", ${$("default-font-family")}`,
					background: `radial-gradient(140% 140% at 80% -20%, rgba(51, 241, 255, 0.2) 0%, rgba(51, 241, 255, 0) 55%), radial-gradient(120% 120% at 0% 0%, rgba(255, 73, 210, 0.18) 0%, rgba(255, 73, 210, 0) 60%), ${$("jam-bg")}`,
					backgroundAttachment: "fixed",
					color: $("jam-text-primary"),
					transition: "background 600ms ease, color 600ms ease",
				}}
			>
				{children}
			</body>
		</html>
	);
}
