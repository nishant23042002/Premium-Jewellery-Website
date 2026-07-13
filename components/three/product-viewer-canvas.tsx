"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PresentationControls, Stage } from "@react-three/drei";
import { ErrorBoundary } from "@/components/common/error-boundary";

interface ProductViewerCanvasProps {
  /** Swap this for the real GLTF product mesh once 3D assets exist. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Establishes the React Three Fiber + Drei integration pattern for a future
 * "spin the ring" product viewer (Phase 1 stack requirement). Ships with a
 * placeholder mesh — no real product models exist yet, this just proves
 * the canvas, lighting, and controls wiring works end to end.
 */
export function ProductViewerCanvas({
  children,
  className,
}: ProductViewerCanvasProps) {
  return (
    <div className={className}>
      <ErrorBoundary
        fallback={
          <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
            3D preview unavailable
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 4], fov: 40 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Stage environment={null} intensity={0.6} shadows="contact">
              <PresentationControls
                global
                snap
                rotation={[0, 0.3, 0]}
                polar={[-0.3, 0.3]}
                azimuth={[-Infinity, Infinity]}
              >
                {children ?? <PlaceholderRing />}
              </PresentationControls>
            </Stage>
            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

function PlaceholderRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <torusGeometry args={[1, 0.28, 32, 100]} />
      <meshStandardMaterial color="#C6A567" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}
