import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  ...(mode === "e2e" ? { envDir: false } : {}),
  plugins: [react()],
}));
