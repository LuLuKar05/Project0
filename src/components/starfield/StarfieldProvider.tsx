'use client';

/**
 * @file src/components/starfield/StarfieldProvider.tsx
 * @description Context provider that mounts the background Starfield and shares
 * its imperative handle with the entire component tree.
 *
 * ─── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * The background Starfield lives in layout.tsx so it persists across all pages.
 * But any client component — a nav link, a button, a page transition — might
 * want to trigger the hyperdrive warp effect.  Passing the Starfield ref down
 * through props across multiple layout layers would be painful prop-drilling.
 *
 * StarfieldProvider solves this with React context:
 *   • It renders exactly ONE <Starfield> (the permanent background one).
 *   • It stores a ref to that Starfield's imperative handle.
 *   • It publishes a stable getter function via context so any descendant can
 *     call setWarp() without any extra props.
 *
 * ─── GETTER PATTERN ──────────────────────────────────────────────────────────
 *
 * We put a *function* in context rather than the ref value directly.
 *
 * Why not store ref.current?
 *   ref.current is null at render time (before the effect runs).  Storing it
 *   in context would always be null for consumers that read it at mount time.
 *
 * Why not store the ref object itself?
 *   Consumers would need to write `starfieldRef.current?.setWarp(1)` — which
 *   works, but leaks the implementation detail that it's a ref.
 *
 * The getter function () => starfieldRef.current:
 *   • Always returns the latest value of the ref (lazily read on each call).
 *   • Has a stable identity (created once with useCallback) so it never
 *     causes unnecessary re-renders in consumers that depend on the context.
 *   • Hides the ref internals — consumers just call `getHandle()?.setWarp(1)`.
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 *
 *   import { useStarfield } from '@/components/starfield/StarfieldProvider';
 *
 *   function HyperdriveButton() {
 *     const starfield = useStarfield();
 *     return (
 *       <button
 *         onMouseEnter={() => starfield?.setWarp(1)}
 *         onMouseLeave={() => starfield?.setWarp(0)}
 *       >
 *         Engage hyperdrive
 *       </button>
 *     );
 *   }
 *
 * Always use optional chaining (?.) — the handle is null before mount and
 * the component may not be present in every test environment.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react';
import Starfield, { type StarfieldHandle } from './Starfield';

// ─── context ───────────────────────────────────────────────────────────────────

/** A function that returns the current StarfieldHandle, or null before mount. */
type StarfieldGetter = () => StarfieldHandle | null;

/**
 * Default context value — a no-op getter that always returns null.
 * Used when a consumer renders outside of StarfieldProvider (e.g. in tests).
 */
const StarfieldContext = createContext<StarfieldGetter>(() => null);

// ─── hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the background Starfield's imperative handle.
 *
 * Returns null if:
 *   • The component hasn't mounted yet (SSR / first paint).
 *   • The hook is called outside of <StarfieldProvider>.
 *
 * Always guard calls with optional chaining:
 *   `useStarfield()?.setWarp(1)`
 */
export function useStarfield(): StarfieldHandle | null {
  const get = useContext(StarfieldContext);
  // Call the getter now — reads ref.current at the time of the call,
  // so it returns the live handle even if the context value hasn't re-rendered.
  return get();
}

// ─── provider ──────────────────────────────────────────────────────────────────

/**
 * Wrap this around your app shell (or root layout body) to mount the background
 * Starfield and make `useStarfield()` available everywhere below.
 *
 * Renders exactly one <Starfield> instance at z-index 0 (behind all content).
 */
export default function StarfieldProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /** Ref attached to the background Starfield's forwardRef handle. */
  const starfieldRef = useRef<StarfieldHandle>(null);

  /**
   * Stable getter — created once, never re-created.
   * Empty dependency array is intentional: starfieldRef is a stable object
   * whose .current property changes imperatively, so it doesn't need to be
   * listed as a dependency.
   */
  const getHandle = useCallback<StarfieldGetter>(
    () => starfieldRef.current,
    [],
  );

  return (
    <StarfieldContext.Provider value={getHandle}>
      {/* The one and only background Starfield — sits at z-index 0 by default */}
      <Starfield ref={starfieldRef} />
      {children}
    </StarfieldContext.Provider>
  );
}
