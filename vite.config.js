import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import netlifyPlugin from "@netlify/vite-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [react(), netlifyPlugin()],
  // Vitest runs with mode "test" and uses esbuild for some transforms; production uses oxc (see Vite 8 warning if both apply).
  ...(mode === "test"
    ? { esbuild: { jsx: "automatic", jsxImportSource: "react" } }
    : {}),
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.{js,jsx}"],
    css: true,
  },
}));
