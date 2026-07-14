"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ADMIN_NAV_GROUPS } from "@/constants/admin-nav";
import { ROUTES } from "@/constants/routes";

interface AdminCommandPaletteProps {
  permissions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QUICK_CREATE = [
  { label: "New Product", href: ROUTES.admin.productNew },
  { label: "New Collection", href: ROUTES.admin.collectionNew },
  { label: "New Offer", href: ROUTES.admin.offerNew },
  { label: "New Blog Post", href: ROUTES.admin.blogNew },
  { label: "New Hero Slide", href: ROUTES.admin.heroSlidesNew },
  { label: "New Testimonial", href: ROUTES.admin.testimonialNew },
  { label: "New Event", href: ROUTES.admin.eventNew },
  { label: "New Styling Story", href: ROUTES.admin.stylingStoriesNew },
];

/** Ctrl/⌘+K palette — indexes every real nav route plus "quick create" shortcuts. Pure client-side filtering, no new data source. */
export function AdminCommandPalette({
  permissions,
  open,
  onOpenChange,
}: AdminCommandPaletteProps) {
  const router = useRouter();

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Jump to a page or create something new"
    >
      <CommandInput placeholder="Jump to a page or create something new..." />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Quick Create">
          {QUICK_CREATE.map((action) => (
            <CommandItem
              key={action.href}
              value={action.label}
              onSelect={() => go(action.href)}
            >
              <Plus className="size-4" />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {ADMIN_NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || permissions.includes(item.permission),
          );
          if (visibleItems.length === 0) return null;
          return (
            <CommandGroup key={group.label} heading={group.label}>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
