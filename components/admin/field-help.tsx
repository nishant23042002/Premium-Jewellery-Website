"use client";

import Image from "next/image";
import Link from "next/link";
import { HelpCircle, SquareArrowOutUpRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ADMIN_HELP } from "@/constants/admin-help";

interface FieldHelpProps {
  /** Key into ADMIN_HELP, e.g. "homepage.heroHeadline". */
  helpKey: keyof typeof ADMIN_HELP;
}

/**
 * Small "?" icon for a form field/section — opens a popover explaining, in
 * plain language, what this actually changes on the live site, with an
 * optional real screenshot of that section and a link to view it live.
 * Aimed at non-technical staff who aren't sure what a given setting does.
 */
export function FieldHelp({ helpKey }: FieldHelpProps) {
  const entry = ADMIN_HELP[helpKey];
  if (!entry) return null;

  return (
    <Popover>
      <PopoverTrigger
        className="focus-luxury inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-gold-dark"
        aria-label="What does this change on the site?"
      >
        <HelpCircle className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-72" side="right" align="start">
        {entry.screenshotUrl && (
          <div className="relative aspect-video overflow-hidden rounded-md border border-border">
            <Image
              src={entry.screenshotUrl}
              alt="Preview of where this appears on the site"
              fill
              sizes="288px"
              className="object-cover object-top"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">{entry.description}</p>
        <Link
          href={entry.siteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold-dark hover:underline"
        >
          View on site
          <SquareArrowOutUpRight className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
