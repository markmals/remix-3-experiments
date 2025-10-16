import type { Remix } from "@remix-run/dom";
import { cssvar as $ } from "~/utils/css-var.ts";
import { Footer } from "./Footer.tsx";
import { Nav } from "./Nav.tsx";

export function Layout({
	children,
	currentUrl,
}: {
	children: Remix.RemixNode;
	currentUrl?: string | URL;
}) {
	return (
		<div
			css={{
				minHeight: $("jam-layout-min-height"),
				display: "flex",
				flexDirection: "column",
				position: "relative",
				isolation: "isolate",
				overflowX: "clip",
				overflowY: "visible",
			}}
		>
		<div
			aria-hidden="true"
			css={{
				position: "absolute",
				inset: 0,
				overflow: "hidden",
				pointerEvents: "none",
				zIndex: $("jam-z-background"),
			}}
		>
			<div
				css={{
					position: "absolute",
					inset: $("jam-aurora-inset"),
					background: $("jam-background-aurora"),
					filter: `blur(${ $("jam-blur-xxl") })`,
					opacity: $("jam-opacity-strong"),
					transform: "translate3d(0, 0, 0)",
				}}
			/>
		</div>
			<Nav currentUrl={currentUrl} />
			<main
				css={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					width: "100%",
				}}
				id="container"
			>
				<div
					css={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
					}}
					id="content"
				>
					{children}
				</div>
				<Footer />
			</main>
		</div>
	);
}
