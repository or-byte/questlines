import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  middleware: "src/middleware/index.ts",
  vite: {
    server: {
      host: true,
      strictPort: false,
      allowedHosts: [
        "precosmic-gymnospermal-milagro.ngrok-free.dev", // for local development
        "localhost"
      ],
    },
  },
});