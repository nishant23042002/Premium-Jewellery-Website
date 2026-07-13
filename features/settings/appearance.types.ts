export interface AppearanceConfig {
  logoUrl?: string;
  faviconUrl?: string;
  /** Hex color — overrides the --gold CSS variable site-wide when set. */
  accentColor?: string;
}

export const DEFAULT_APPEARANCE_CONFIG: AppearanceConfig = {};
