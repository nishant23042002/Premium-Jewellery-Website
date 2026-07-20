"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { ImageReveal } from "@/components/motion/image-reveal";
import { MouseGlow } from "@/components/motion/mouse-glow";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/lib/utils/format";
import type { BlogPost } from "@/features/blog/blog-post.types";

/** Same lift + cursor-glow hover pattern as CollectionCard/ProductCard (PRD "hover states must match across the catalogue"). */
export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={ROUTES.blogPost(post.slug)} className="group block">
        <MouseGlow
          color="var(--gold-light)"
          className="aspect-4/3 rounded-xl shadow-sm transition-shadow duration-300 group-hover:shadow-md"
        >
          <ImageReveal className="absolute inset-0">
            {post.coverImageUrl ? (
              <ImageWithFallback
                src={post.coverImageUrl}
                alt={post.title.en}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <PlaceholderImage
                seed={post.slug}
                icon={BookOpen}
                className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
            )}
          </ImageReveal>
        </MouseGlow>
        <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
          {formatDate(post.publishedAt)} · {post.category}
        </p>
        <h3 className="mt-1 font-heading text-lg group-hover:text-gold-dark">
          {post.title.en}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {post.excerpt.en}
        </p>
      </Link>
    </motion.div>
  );
}
