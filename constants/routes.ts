/** Central route map (PRD §5, Phase 4 site map) — every link should resolve through here, not string literals. */
export const ROUTES = {
  home: "/",
  about: "/about",

  collections: "/collections",
  collection: (slug: string) => `/collections/${slug}`,

  categories: "/categories",
  category: (slug: string) => `/categories/${slug}`,

  products: "/products",
  product: (slug: string) => `/product/${slug}`,
  wishlist: "/wishlist",
  compare: "/compare",

  offers: "/offers",

  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,

  faq: "/faq",
  jewelleryCare: "/jewellery-care",
  hallmark: "/hallmark",
  page: (slug: string) => `/pages/${slug}`,
  gallery: "/gallery",
  testimonials: "/testimonials",
  events: "/events",

  contact: "/contact",
  reservation: "/reservation",

  privacy: "/privacy",
  terms: "/terms",

  account: "/account",
  accountLogin: "/account/login",
  accountSignup: "/account/signup",
  accountForgotPassword: "/account/forgot-password",
  accountResetPassword: "/account/reset-password",
  accountOrders: "/account/orders",
  accountOrder: (id: string) => `/account/orders/${id}`,
  accountReservations: "/account/reservations",
  apiAuthGoogle: "/api/auth/google",

  cart: "/cart",
  checkout: "/checkout",
  orderConfirmation: (id: string) => `/order/${id}/confirmation`,

  admin: {
    login: "/admin/login",
    dashboard: "/admin/dashboard",
    analytics: "/admin/analytics",

    products: "/admin/products",
    productNew: "/admin/products/new",
    product: (id: string) => `/admin/products/${id}`,

    categories: "/admin/categories",
    categoryNew: "/admin/categories/new",
    category: (id: string) => `/admin/categories/${id}`,

    collections: "/admin/collections",
    collectionNew: "/admin/collections/new",
    collection: (id: string) => `/admin/collections/${id}`,

    media: "/admin/media",

    offers: "/admin/offers",
    offerNew: "/admin/offers/new",
    offer: (id: string) => `/admin/offers/${id}`,

    reservations: "/admin/reservations",
    reservation: (id: string) => `/admin/reservations/${id}`,

    orders: "/admin/orders",
    order: (id: string) => `/admin/orders/${id}`,

    customers: "/admin/customers",
    customer: (id: string) => `/admin/customers/${id}`,

    enquiries: "/admin/enquiries",
    rates: "/admin/rates",

    blog: "/admin/blog",
    blogNew: "/admin/blog/new",
    blogPost: (id: string) => `/admin/blog/${id}`,

    pages: "/admin/pages",
    pageNew: "/admin/pages/new",
    page: (id: string) => `/admin/pages/${id}`,

    faq: "/admin/faq",
    faqNew: "/admin/faq/new",
    faqItem: (id: string) => `/admin/faq/${id}`,

    gallery: "/admin/gallery",
    galleryNew: "/admin/gallery/new",
    galleryItem: (id: string) => `/admin/gallery/${id}`,

    stylingStories: "/admin/styling-stories",
    stylingStoriesNew: "/admin/styling-stories/new",
    stylingStoriesItem: (id: string) => `/admin/styling-stories/${id}`,

    testimonials: "/admin/testimonials",
    testimonialNew: "/admin/testimonials/new",
    testimonial: (id: string) => `/admin/testimonials/${id}`,

    events: "/admin/events",
    eventNew: "/admin/events/new",
    event: (id: string) => `/admin/events/${id}`,

    staff: "/admin/staff",
    staffNew: "/admin/staff/new",
    staffMember: (id: string) => `/admin/staff/${id}`,

    roles: "/admin/roles",
    roleNew: "/admin/roles/new",
    role: (id: string) => `/admin/roles/${id}`,

    homepageBuilder: "/admin/homepage-builder",
    announcementBar: "/admin/announcement-bar",

    heroSlides: "/admin/hero-slides",
    heroSlidesNew: "/admin/hero-slides/new",
    heroSlidesItem: (id: string) => `/admin/hero-slides/${id}`,

    settings: "/admin/settings",
    settingsAppearance: "/admin/settings/appearance",
    settingsSeo: "/admin/settings/seo",

    auditLogs: "/admin/audit-logs",
    recycleBin: "/admin/recycle-bin",
    backups: "/admin/backups",
    importExport: "/admin/import-export",
  },
} as const;
