import { cn } from "@/lib/utils";

type ContainerElement =
  "div" | "section" | "nav" | "header" | "footer" | "main";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  width?: "narrow" | "content" | "wide";
  /** Renders as a different element — e.g. "section" for a page section wrapper. */
  as?: ContainerElement;
}

/**
 * Standard page-edge wrapper (Phase 2 "Container Widths" + "Padding
 * Rules"). Wraps the `.container-luxury` CSS utility so width/padding stay
 * centralized in one place (app/globals.css) instead of repeated
 * `max-w-* mx-auto px-4 sm:px-6 lg:px-8` on every section.
 */
export function Container({
  width = "content",
  as: Component = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "container-luxury",
        width === "narrow" && "container-luxury--narrow",
        width === "wide" && "container-luxury--wide",
        className,
      )}
      {...props}
    />
  );
}
