import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarClock,
  Coins,
  ShoppingBag,
  DatabaseBackup,
  FileText,
  FileUp,
  FolderTree,
  GalleryHorizontal,
  HelpCircle,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  Megaphone,
  MessageSquare,
  Newspaper,
  Package,
  PartyPopper,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Undefined means visible to any authenticated admin regardless of role/permissions. */
  permission?: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

/** Drives the admin sidebar (Phase 7) — grouped, permission-gated navigation. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: ROUTES.admin.dashboard,
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
      {
        label: "Analytics",
        href: ROUTES.admin.analytics,
        icon: BarChart3,
        permission: "analytics.view",
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: "Products",
        href: ROUTES.admin.products,
        icon: Package,
        permission: "products.manage",
      },
      {
        label: "Collections",
        href: ROUTES.admin.collections,
        icon: Layers,
        permission: "collections.manage",
      },
      {
        label: "Categories",
        href: ROUTES.admin.categories,
        icon: FolderTree,
        permission: "categories.manage",
      },
      {
        label: "Media",
        href: ROUTES.admin.media,
        icon: ImageIcon,
        permission: "media.manage",
      },
      {
        label: "Offers",
        href: ROUTES.admin.offers,
        icon: Tag,
        permission: "offers.manage",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Orders",
        href: ROUTES.admin.orders,
        icon: ShoppingBag,
        permission: "orders.manage",
      },
      {
        label: "Reservations",
        href: ROUTES.admin.reservations,
        icon: CalendarClock,
        permission: "reservations.manage",
      },
      {
        label: "Customers",
        href: ROUTES.admin.customers,
        icon: Users,
        permission: "customers.manage",
      },
      {
        label: "Enquiries",
        href: ROUTES.admin.enquiries,
        icon: MessageSquare,
        permission: "enquiries.manage",
      },
      {
        label: "Metal Rates",
        href: ROUTES.admin.rates,
        icon: Coins,
        permission: "rates.manage",
      },
    ],
  },
  {
    label: "Content (CMS)",
    items: [
      {
        label: "Blogs",
        href: ROUTES.admin.blog,
        icon: Newspaper,
        permission: "blog.manage",
      },
      {
        label: "Pages",
        href: ROUTES.admin.pages,
        icon: FileText,
        permission: "pages.manage",
      },
      {
        label: "FAQ",
        href: ROUTES.admin.faq,
        icon: HelpCircle,
        permission: "faq.manage",
      },
      {
        label: "Gallery",
        href: ROUTES.admin.gallery,
        icon: GalleryHorizontal,
        permission: "gallery.manage",
      },
      {
        label: "Styling Stories",
        href: ROUTES.admin.stylingStories,
        icon: Sparkles,
        permission: "styling_stories.manage",
      },
      {
        label: "Testimonials",
        href: ROUTES.admin.testimonials,
        icon: Star,
        permission: "testimonials.manage",
      },
      {
        label: "Events",
        href: ROUTES.admin.events,
        icon: PartyPopper,
        permission: "events.manage",
      },
    ],
  },
  {
    label: "Team",
    items: [
      {
        label: "Staff",
        href: ROUTES.admin.staff,
        icon: UserCog,
        permission: "staff.manage",
      },
      {
        label: "Roles & Permissions",
        href: ROUTES.admin.roles,
        icon: ShieldCheck,
        permission: "roles.manage",
      },
    ],
  },
  {
    label: "Site",
    items: [
      {
        label: "Homepage Builder",
        href: ROUTES.admin.homepageBuilder,
        icon: LayoutTemplate,
        permission: "homepage.manage",
      },
      {
        label: "Hero Slides",
        href: ROUTES.admin.heroSlides,
        icon: Images,
        permission: "hero_slides.manage",
      },
      {
        label: "Announcement Bar",
        href: ROUTES.admin.announcementBar,
        icon: Megaphone,
        permission: "announcement.manage",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "Appearance",
        href: ROUTES.admin.settingsAppearance,
        icon: Settings,
        permission: "settings.manage",
      },
      {
        label: "SEO",
        href: ROUTES.admin.settingsSeo,
        icon: Settings,
        permission: "settings.manage",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Audit Logs",
        href: ROUTES.admin.auditLogs,
        icon: ScrollText,
        permission: "audit.view",
      },
      {
        label: "Recycle Bin",
        href: ROUTES.admin.recycleBin,
        icon: Trash2,
        permission: "recycle_bin.manage",
      },
      {
        label: "Backups",
        href: ROUTES.admin.backups,
        icon: DatabaseBackup,
        permission: "backups.manage",
      },
      {
        label: "Import / Export",
        href: ROUTES.admin.importExport,
        icon: FileUp,
        permission: "import_export.manage",
      },
    ],
  },
];

/** Flattened lookup used by the sidebar's Favorites/Recents rows and the command palette. */
export const ALL_ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items,
);
