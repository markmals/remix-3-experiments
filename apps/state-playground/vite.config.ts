import babel from "@rollup/plugin-babel";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        babel({
            babelHelpers: "bundled",
            extensions: [".js", ".ts", ".jsx", ".tsx"],
        }),
    ],
    server: {
        port: 1613,
    },
    experimental: {
        enableNativePlugin: true,
    },
    resolve: {
        tsconfigPaths: true,
    },
    css: {
        transformer: "lightningcss",
    },
});
