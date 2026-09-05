import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Only the /admin/ editor is built. The public site (index.html + src/*.js)
// stays plain static files; Vite's root is the repo so the editor's live
// preview can iframe `/?preview=1` on the same origin in dev.
export default defineConfig({
  plugins: [react()],
  // bzs-edit ships TypeScript source — let this project's toolchain compile it.
  optimizeDeps: { exclude: ["bzs-edit"] },
  build: {
    rolldownOptions: { input: "admin/index.html" },
    assetsDir: "admin/assets", // everything lands under dist/admin/
  },
  server: {
    port: 5174, // jordie is 5173; same origin would share localStorage.admin_token
    open: "/admin/",
    proxy: { "/api": "http://127.0.0.1:3006" },
  },
});
