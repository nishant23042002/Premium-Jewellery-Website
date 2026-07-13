/** Every permission key the admin panel understands, grouped for the Roles editor's checkbox matrix (Phase 7 "Permissions"). */
export interface PermissionDef {
  key: string;
  label: string;
  group: string;
}

export const PERMISSION_GROUPS = [
  "Catalogue",
  "Sales",
  "Content",
  "Team",
  "Site",
  "System",
  "Insights",
] as const;

export const PERMISSIONS: PermissionDef[] = [
  { key: "products.manage", label: "Manage products", group: "Catalogue" },
  { key: "categories.manage", label: "Manage categories", group: "Catalogue" },
  {
    key: "collections.manage",
    label: "Manage collections",
    group: "Catalogue",
  },
  { key: "offers.manage", label: "Manage offers", group: "Catalogue" },
  { key: "media.manage", label: "Manage media library", group: "Catalogue" },

  { key: "orders.manage", label: "Manage orders", group: "Sales" },
  { key: "reservations.manage", label: "Manage reservations", group: "Sales" },
  { key: "customers.manage", label: "Manage customers", group: "Sales" },
  { key: "enquiries.manage", label: "Manage enquiries", group: "Sales" },
  { key: "rates.manage", label: "Update gold/silver rates", group: "Sales" },

  { key: "blog.manage", label: "Manage blog posts", group: "Content" },
  { key: "faq.manage", label: "Manage FAQ", group: "Content" },
  { key: "gallery.manage", label: "Manage store gallery", group: "Content" },
  {
    key: "styling_stories.manage",
    label: "Manage styling stories",
    group: "Content",
  },
  { key: "pages.manage", label: "Manage site pages", group: "Content" },
  {
    key: "testimonials.manage",
    label: "Manage testimonials",
    group: "Content",
  },
  { key: "events.manage", label: "Manage events", group: "Content" },

  { key: "staff.manage", label: "Manage staff accounts", group: "Team" },
  { key: "roles.manage", label: "Manage roles & permissions", group: "Team" },

  { key: "homepage.manage", label: "Manage homepage builder", group: "Site" },
  {
    key: "hero_slides.manage",
    label: "Manage hero banner slides",
    group: "Site",
  },
  {
    key: "announcement.manage",
    label: "Manage announcement bar",
    group: "Site",
  },
  { key: "settings.manage", label: "Manage site settings", group: "Site" },

  { key: "audit.view", label: "View audit logs", group: "System" },
  { key: "recycle_bin.manage", label: "Manage recycle bin", group: "System" },
  {
    key: "backups.manage",
    label: "Create & download backups",
    group: "System",
  },
  {
    key: "import_export.manage",
    label: "Import & export data",
    group: "System",
  },

  { key: "dashboard.view", label: "View dashboard", group: "Insights" },
  { key: "analytics.view", label: "View analytics", group: "Insights" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

/** Sensible default for the seeded "Staff" system role — day-to-day operations, no team/system/settings access. */
export const DEFAULT_STAFF_PERMISSIONS = [
  "products.manage",
  "categories.manage",
  "collections.manage",
  "offers.manage",
  "media.manage",
  "orders.manage",
  "reservations.manage",
  "customers.manage",
  "enquiries.manage",
  "rates.manage",
  "blog.manage",
  "faq.manage",
  "gallery.manage",
  "styling_stories.manage",
  "testimonials.manage",
  "events.manage",
  "dashboard.view",
];
