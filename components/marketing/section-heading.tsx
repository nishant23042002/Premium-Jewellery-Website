import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/** Recurring in-page section intro (eyebrow + heading + description), scroll-revealed. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className="text-gradient-gold mb-2 text-xs font-medium tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-heading text-3xl",
          align === "center" && "mx-auto max-w-xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3 max-w-xl text-sm text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
