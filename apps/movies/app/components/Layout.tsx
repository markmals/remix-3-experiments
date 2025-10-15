import type { Remix } from "@remix-run/dom";
import { Footer } from "./Footer.tsx";
import { Nav } from "./Nav.tsx";

export function Layout({ children }: { children: Remix.RemixNode }) {
	return (
		<div
			css={{
				minHeight: "100vh",
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
					zIndex: -1,
				}}
			>
				<div
					css={{
						position: "absolute",
						inset: "-25% -30%",
						background:
							"radial-gradient(50% 50% at 20% 20%, rgba(51, 241, 255, 0.12) 0%, rgba(51, 241, 255, 0) 65%), radial-gradient(45% 45% at 80% 15%, rgba(255, 73, 210, 0.12) 0%, rgba(255, 73, 210, 0) 70%)",
						filter: "blur(60px)",
						opacity: 0.9,
						transform: "translate3d(0, 0, 0)",
					}}
				/>
			</div>
			<Nav />
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
