export interface GoogleReview {
  authorName: string;
  profilePhotoUrl?: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  /** Unix seconds, as returned by the Places API. */
  time: number;
}
