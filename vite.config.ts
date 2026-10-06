import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { createWelfareApi } from "./server/api.mjs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "welfare-gemma-api",
      configureServer(server) {
        server.middlewares.use(createWelfareApi());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createWelfareApi());
      },
    },
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    restoreMocks: true,
  },
});
