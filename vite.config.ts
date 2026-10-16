import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: "/mydaily/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/s3-att": {
        target: "https://audiototext-pipeline.s3.eu-central-1.amazonaws.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/s3-att/, ""),
      },

      "/translate-api": {
        target: "https://translate.jotme.io",   // vd: https://api.xxx.com
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/translate-api/, ""),
        // Nếu server kiểm tra Origin/Referer thì giả lập như trang gốc:
        configure: (proxy) => {
          proxy.on("proxyReq", (req) => {
            req.setHeader("origin", "https://translate.jotme.io");
            req.setHeader("referer", "https://translate.jotme.io/");
          });
        },
      },
    },
  },
})