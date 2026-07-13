import { SITE } from "@/constants/site";

export interface Branch {
  id: string;
  name: string;
  address: string;
}

/**
 * Single showroom today — modeled as a list from day one so a second
 * branch (PRD §45 future SaaS / multi-store roadmap) is a data addition,
 * not a schema change. Reservation.branchId always references one of these.
 */
export const BRANCHES: Branch[] = [
  {
    id: "roha-main",
    name: `${SITE.name} — Main Bazar Peth`,
    address: SITE.address.full,
  },
];

export const DEFAULT_BRANCH_ID = BRANCHES[0].id;
