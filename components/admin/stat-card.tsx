import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  accent?: boolean;
  /** Small trailing element next to the value — typically a <GrowthBadge>. */
  badge?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
  badge,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "border-border/60",
        accent && "border-gold/40 ring-1 ring-gold/10",
      )}
    >
      <CardContent className="flex items-center gap-3 pt-2">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent
              ? "bg-gold/10 text-gold-dark"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-semibold">{value}</p>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link
      href={href}
      className="block transition-transform hover:-translate-y-0.5"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
