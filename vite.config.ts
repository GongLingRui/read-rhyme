import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path, // Keep /api prefix
        preserveHeaderKeyCase: true,
        // Important: Don't parse body for FormData uploads
        // Allow multipart/form-data to pass through
        configure: (proxy, opts) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log request
            console.log('[Proxy] Request:', req.method, req.url);
            console.log('[Proxy] Content-Type:', req.headers['content-type']);
            if (req.headers['content-length']) {
              console.log('[Proxy] Body length:', req.headers['content-length']);
            }

            // Forward Authorization header
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          proxy.on('proxyRes', (proxyReq, req, res) => {
            console.log('[Proxy] Response:', proxyReq.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy] Error:', err.message);
          });
        },
      },
      "/static": {
        target: process.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: process.env.VITE_WS_BASE_URL?.replace("/ws", "") || "ws://localhost:8000",
        ws: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
