import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    server: {
      host: true,
      strictPort: false,
      allowedHosts: [
        process.env.NGROK_HOST || "",
        "localhost"
      ],
    },
  },
});