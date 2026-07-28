import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import checker from "vite-plugin-checker";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
    envDir: "./env",
    plugins: [
        cloudflare(),
        checker({
            typescript: true
        })
    ],
    build: {
        // generate .vite/manifest.json in outDir
        manifest: true,
        rollupOptions: {
            // overwrite default .html entry
            input: '/src/client/index.ts',
            output: {
                assetFileNames: (asset_info) => {
                    const original_filename = asset_info.originalFileNames[0];
                    if (original_filename && original_filename.startsWith(`node_modules/flag-icons/`)) {
                        return `flags/[name]-[hash][extname]`
                    }

                    return 'assets/[name]-[hash][extname]';
                },
                manualChunks: (id) => {
                    // Keep route-specific dependencies in their dynamic route
                    // chunks. Forcing these libraries into named manual chunks
                    // makes Vite preload them from the application entry.
                    return null;
                }
            }
        },
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell Vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
});
