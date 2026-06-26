'use client';

/**
 * @file src/features/galaxy/components/scene/CameraRig.tsx
 * Smoothly drives the camera between overview and planet-follow modes.
 *
 * Frame-rate-independent exponential damping (THREE.MathUtils.damp) moves
 * the camera position and lookAt target toward their goals every frame:
 *
 *   overview  — OVERVIEW_POS looking at the core; the camera starts at
 *               ENTRY_POS (set on <Canvas>) so the first seconds play a
 *               fly-in entry animation with zero extra code.
 *   selected  — hovers beside the chosen planet, continuously following
 *               it along its orbit and looking at it.
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OVERVIEW_POS, OVERVIEW_TGT } from '@/features/galaxy/lib/sceneConfig';

interface CameraRigProps {
  selIdx: number;
  positionsRef: React.RefObject<THREE.Vector3[]>;
}

const OVERVIEW_POSITION = new THREE.Vector3(...OVERVIEW_POS);
const OVERVIEW_TARGET   = new THREE.Vector3(...OVERVIEW_TGT);

// Reusable temporaries (avoid per-frame allocation).
const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();

/**
 * Desktop: panel is on the RIGHT half, so aim to the planet's screen-right to
 * push it into the LEFT half. Mobile: panel is a BOTTOM sheet, so don't shift
 * sideways — instead aim BELOW the planet to raise it into the area above the
 * sheet, and stand off a little further (narrow portrait FOV magnifies things).
 */
const SELECT_AIM_SHIFT  = 1.0;  // desktop: push planet left
const MOBILE_AIM_UP     = 2.2;  // mobile: raise planet above the bottom sheet
const MOBILE_BREAKPOINT = 820;  // matches the CSS bottom-sheet breakpoint

export default function CameraRig({ selIdx, positionsRef }: CameraRigProps) {
  /** Current lookAt point, damped separately from the camera position. */
  const lookAtRef = useRef(new THREE.Vector3(...OVERVIEW_TGT));
  const goalPos   = useRef(new THREE.Vector3());
  const goalTgt   = useRef(new THREE.Vector3());
  const offset    = useRef(new THREE.Vector3());
  const width     = useThree((s) => s.size.width);

  useFrame(({ camera }, dt) => {
    const planetPos = selIdx >= 0 ? positionsRef.current[selIdx] : undefined;
    const isMobile  = width <= MOBILE_BREAKPOINT;

    if (planetPos) {
      // Stand off from the planet: outward from the core, raised slightly.
      offset.current.copy(planetPos).normalize().multiplyScalar(isMobile ? 3.2 : 2.6);
      goalPos.current.copy(planetPos).add(offset.current);
      goalPos.current.y += isMobile ? 1.5 : 1.2;
      goalTgt.current.copy(planetPos);

      if (isMobile) {
        // Centered horizontally; aim below the planet so it sits above the sheet.
        goalTgt.current.y -= MOBILE_AIM_UP;
      } else {
        // Aim to the planet's screen-right so it renders in the left half,
        // beside the detail panel rather than behind it.
        _forward.copy(planetPos).sub(goalPos.current).normalize();
        _right.crossVectors(_forward, camera.up).normalize();
        goalTgt.current.addScaledVector(_right, SELECT_AIM_SHIFT);
      }
    } else {
      goalPos.current.copy(OVERVIEW_POSITION);
      goalTgt.current.copy(OVERVIEW_TARGET);
    }

    const lambda = 2.4;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, goalPos.current.x, lambda, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goalPos.current.y, lambda, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, goalPos.current.z, lambda, dt);

    const la = lookAtRef.current;
    la.x = THREE.MathUtils.damp(la.x, goalTgt.current.x, lambda, dt);
    la.y = THREE.MathUtils.damp(la.y, goalTgt.current.y, lambda, dt);
    la.z = THREE.MathUtils.damp(la.z, goalTgt.current.z, lambda, dt);
    camera.lookAt(la);
  });

  return null;
}
