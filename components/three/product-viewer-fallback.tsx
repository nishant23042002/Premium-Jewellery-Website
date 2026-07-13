import { Loader } from "@/components/common/loader";

/**
 * Deliberately in its own file, importing nothing from `@react-three/fiber`
 * or `@react-three/drei` — `product-viewer-canvas.tsx` pulls in those
 * (large) libraries at module scope, so anything that statically imports
 * from that file drags them into its bundle too, even if it only wants
 * this fallback. Keeping the fallback here lets `product-gallery.tsx`
 * show a loading state without paying for the 3D bundle up front.
 */
export function ProductViewerFallback() {
  return <Loader label="Loading 3D preview" />;
}
