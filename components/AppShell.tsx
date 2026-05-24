'use client';

/**
 * @file components/AppShell.tsx
 * @description Client-side shell that sits inside <StarfieldProvider> and
 * wraps all page content.  Its single responsibility is to show the
 * <LoadingScreen> hyperdrive sequence exactly once on the first client paint.
 *
 * ─── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * layout.tsx is a Next.js Server Component — it runs on the server during SSR
 * and cannot use hooks (useState, useEffect) or browser APIs.
 *
 * The loading screen needs:
 *   • useState / useEffect  → browser-only React hooks
 *   • setTimeout            → browser API
 *   • Three.js WebGL        → absolutely browser-only
 *
 * Putting <LoadingScreen> directly in layout.tsx would crash on the server.
 * Even with 'use client' on layout.tsx, Next.js would still attempt to
 * render the initial HTML on the server and the mismatch would cause a
 * hydration error (the server HTML has no loading screen; the client does).
 *
 * AppShell solves this with a `hasMounted` guard:
 *
 *   Server render:  hasMounted = false  →  <LoadingScreen> is NOT in the HTML.
 *   Client hydrate: hasMounted = false  →  React matches the server HTML. ✓
 *   After hydration: useEffect fires → hasMounted = true → <LoadingScreen> mounts.
 *
 * This guarantees zero hydration mismatches and the loading screen only ever
 * runs in the browser.
 *
 * ─── SHOW ONCE BEHAVIOUR ─────────────────────────────────────────────────────
 *
 * layout.tsx in Next.js persists across client-side navigations — it only
 * unmounts on a full page reload.  Because AppShell itself never unmounts
 * during navigation, `hasMounted` stays true and <LoadingScreen> is never
 * re-added after it self-destructs.
 *
 * The loading screen therefore runs exactly once per hard refresh / first load,
 * which is the desired behaviour.
 *
 * ─── RELATIONSHIP TO OTHER COMPONENTS ────────────────────────────────────────
 *
 *   layout.tsx
 *     └── <StarfieldProvider>          exposes useStarfield() to the tree
 *           └── <AppShell>             ← this file
 *                 ├── <LoadingScreen>  (only on client, only once)
 *                 └── {children}       actual page content
 */

import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

export default function AppShell({ children }: { children: React.ReactNode }) {
  /**
   * hasMounted starts false so the server render and the initial client render
   * match exactly (neither includes <LoadingScreen>).
   *
   * The useEffect below flips it to true after React has finished hydration,
   * which is safe to do because effects only run in the browser.
   */
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // This runs exactly once, on the client, after the first render.
    // Setting hasMounted here triggers a re-render that adds <LoadingScreen>.
    setHasMounted(true);
  }, []);

  return (
    <>
      {/*
       * Render the hyperdrive loading overlay only after client mount.
       * LoadingScreen is a self-contained component — it starts its own timers
       * and calls setMounted(false) internally when the sequence completes,
       * removing itself from the DOM with no further action needed here.
       */}
      {hasMounted && <LoadingScreen />}

      {/* Page content rendered by Next.js (the current route's page.tsx) */}
      {children}
    </>
  );
}
