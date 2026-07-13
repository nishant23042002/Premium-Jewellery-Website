"use client";

import Image from "next/image";
import Link from "next/link";
import { MouseGlow } from "@/components/motion/mouse-glow";

interface ExperienceTileProps {
  href: string;
  imageUrl: string;
  alt: string;
  title: string;
  external?: boolean;
}

/**
 * "Shree Ambika Experience" grid tile — image with a caption band below
 * (not overlaid), mirroring the Tanishq reference screenshot's layout.
 * "use client" only because `MouseGlow` needs it; the async Server
 * Component homepage can't declare that itself.
 */
export function ExperienceTile({
  href,
  imageUrl,
  alt,
  title,
  external,
}: ExperienceTileProps) {
  const content = (
    <>
      <MouseGlow
        color="var(--gold-light)"
        className="relative aspect-3/3 overflow-hidden"
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </MouseGlow>
      <div className="px-4 py-4 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-foreground uppercase">
          {title}
        </p>
      </div>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="group block">
      {content}
    </Link>
  );
}
