export interface AnnouncementBarConfig {
  isActive: boolean;
  message: string;
  linkLabel?: string;
  linkHref?: string;
}

export const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarConfig = {
  isActive: false,
  message: "",
};
