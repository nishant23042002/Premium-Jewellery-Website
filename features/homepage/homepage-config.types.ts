export interface HomepageConfig {
  showTrustBar: boolean;
  showCollections: boolean;
  showCategories: boolean;
  /** Powers the "Online Exclusive" section (made-to-order products) — despite the name, no longer tied to the isFeatured flag. */
  showOnlineExclusive: boolean;
  showAllProducts: boolean;
  showNewArrivals: boolean;
  showStyling: boolean;
  showStoryTeaser: boolean;
  showExperience: boolean;
  showTestimonials: boolean;
  /** Overrides the "Our Story" section image — falls back to a built-in default when unset. */
  storyImageUrl?: string;
  /** Overrides for the 6 "Shree Ambika Experience" tile images, in their fixed display order — each falls back to a built-in default when unset. */
  experienceVisitStoreImageUrl?: string;
  experienceBookAppointmentImageUrl?: string;
  experienceTalkToExpertImageUrl?: string;
  experienceReadJournalImageUrl?: string;
  experienceJewelleryCareImageUrl?: string;
  experienceHallmarkImageUrl?: string;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  showTrustBar: true,
  showCollections: true,
  showCategories: true,
  showOnlineExclusive: true,
  showAllProducts: true,
  showNewArrivals: true,
  showStyling: true,
  showStoryTeaser: true,
  showExperience: true,
  showTestimonials: true,
};
