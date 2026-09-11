import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // `public/` (manifest.json, sw.js, icons, wonderland-logo.jpg) is the
  // Vite default already — listed explicitly so it's obvious it's expected.
  publicDir: 'public',

  server: {
    port: 5173,
    // Vite's default appType is 'spa', so client-side routes (react-router-dom)
    // already fall back to index.html in dev — no extra history-fallback config needed.
  },

  preview: {
    port: 4173,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Terser over esbuild's default minifier: slower build, meaningfully
    // smaller/harder-to-read output — worth it for a production build that
    // runs once in CI, not on every dev save.
    //
    // HONEST LIMITS OF THIS, worth knowing before relying on it: this
    // shrinks and mangles variable/function names, it does not encrypt or
    // hide logic. Anything that runs in a browser is fully downloadable
    // and de-minifiable by anyone who opens devtools — that's true of every
    // client-side web app, not a gap specific to this one. It raises the
    // effort needed to casually read the bundle; it is not a substitute
    // for keeping real secrets (API keys with privileged access, business
    // logic that must not be tampered with) out of the client entirely —
    // that's what Firestore security rules and Cloud Functions are for.
    minify: 'terser',
    terserOptions: {
      compress: {
        // Also strip console/debugger calls from the production bundle —
        // separate from and in addition to src/lib/consoleGuard.js, which
        // no-ops console methods at runtime; this removes the call sites
        // entirely at build time so there's nothing left to no-op.
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        // Do NOT mangle class/function names touched by string-based
        // lookups (Firestore field names via bracket access, etc. are
        // untouched by mangling regardless — mangling only ever renames
        // identifiers, never object keys/string literals — but keep_fnames
        // off would still be safe here; toggle on only if a stack trace
        // from production ever needs to stay human-readable while
        // debugging a live issue).
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    // Several pages pull in large, page-specific libraries (PDF generation/
    // reading, Word export/import, Excel import/export, zipping). Splitting
    // them into their own chunks keeps the main app bundle small — these
    // only get fetched when a user actually opens a page that needs them.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (id.includes('/pdfjs-dist/')) return 'pdf';
          if (id.includes('/mammoth/')) return 'docx';
          if (id.includes('/xlsx/')) return 'excel';
          if (id.includes('/jszip/')) return 'zip';
        },
      },
    },
  },
});
