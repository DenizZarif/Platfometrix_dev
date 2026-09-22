export type MarketAdoptionTier =
  | "Market leader"
  | "Widely adopted"
  | "Established"
  | "Emerging / niche";

export interface MarketAdoption {
  tier: MarketAdoptionTier;
  note: string;
}