import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        // Polyfill global cho browser
        global: "globalThis",
    },
    resolve: {
        alias: {
            // Polyfill Buffer cho browser
            buffer: "buffer",
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: "globalThis",
            },
        },
    },
});
