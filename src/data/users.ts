/**
 * Mock Users for STARK Procurement
 *
 * Matches personas from Command Center for consistency.
 * In production, this would come from auth/SSO.
 */

export interface User {
  id: string;
  name: string;
  title: string;
  initials: string;
  email: string;
}

export const USERS: User[] = [
  {
    id: "mads",
    name: "Mads Jensen",
    title: "Buyer",
    initials: "MJ",
    email: "mads.jensen@stark.dk",
  },
  {
    id: "kim",
    name: "Kim Nielsen",
    title: "Product Owner",
    initials: "KN",
    email: "kim.nielsen@stark.dk",
  },
  {
    id: "lars",
    name: "Lars Andersen",
    title: "Business Analyst",
    initials: "LA",
    email: "lars.andersen@stark.dk",
  },
];

export const DEFAULT_USER = USERS[0]; // Mads (Buyer)
