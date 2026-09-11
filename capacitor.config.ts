import type { CapacitorConfig } from '@capacitor/cli';

// NOTE ON appId: this is a placeholder reverse-domain identifier
// (com.wonderlandacademy.erp). It becomes the Android applicationId and,
// once you publish to the Play Store, it is effectively permanent — change
// it now, before the first real build, if you want something different.
//
// webDir points at Vite's build output (see vite.config.js -> build.outDir)
// — `npx cap sync` copies whatever is in dist/ into the native project, so
// always run `npm run build` (or `npm run build:android`) before syncing.
const config: CapacitorConfig = {
  appId: 'com.wonderlandacademy.erp',
  appName: 'Wonderland Academy',
  webDir: 'dist',
};

export default config;
