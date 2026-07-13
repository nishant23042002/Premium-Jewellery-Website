import { BadgeCheck, Gem, Hammer, Store } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  {
    icon: Gem,
    title: "Sourced",
    description: "Metal and stones sourced from trusted, verified suppliers.",
  },
  {
    icon: Hammer,
    title: "Crafted",
    description: "Shaped and finished by hand at our workshop.",
  },
  {
    icon: BadgeCheck,
    title: "Hallmarked",
    description: "Independently assayed and BIS hallmark certified.",
  },
  {
    icon: Store,
    title: "In Showroom",
    description: "Quality-checked and placed on display, ready to view.",
  },
];

/**
 * Craftsmanship/provenance storytelling strip (Phase 5 "Product Timeline")
 * — editorial, not DB-driven; every piece follows the same four-step
 * journey so this stays generic across the catalogue.
 */
export function ProductTimeline() {
  return (
    <ol className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {STEPS.map((step, i) => (
        <li key={step.title}>
          <Reveal index={i} className="flex flex-col items-start gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-gold/10">
              <step.icon className="size-4 text-gold-dark" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
