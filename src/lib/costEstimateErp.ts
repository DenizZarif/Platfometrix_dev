import type { ErpTool } from "@/data/erpTools";
import type { CostEstimate } from "./costEstimate";

/** Indicative starting list price per user (or employee) per month. */
const LIST_PRICE: Record<string, number> = {
  netsuite: 99,
  businesscentral: 80,
  odoo: 24.9,
  sapb1: 95,
  epicor: 100,
  sagex3: 100,
  syspro: 75,
  zohoone: 37,
  deltek: 75,
  priority: 60,
  qad: 90,
};

const HEADCOUNT_BY_SIZE: Record<string, number> = {
  "1-10": 5,
  "11-50": 30,
  "51-200": 125,
  "201-1000": 600,
  "1000+": 1500,
};
const SIZE_INDEX: Record<string, number> = { "1-10": 0, "11-50": 1, "51-200": 2, "201-1000": 3, "1000+": 4 };

const COST_LABEL = ["", "Very low cost", "Low cost", "Mid-range cost", "Premium cost", "Enterprise cost"];
const PRICING_LABEL: Record<ErpTool["pricing_model"], string> = {
  "per-seat": "Per-user",
  consumption: "Consumption-based",
  quote: "Quote-based",
  free: "Free / open-source",
};

const LOW_IMPLEMENTATION = new Set(["zohoone", "odoo", "erpnext", "businesscentral"]);

export const ERP_PRICING_DISCLAIMER =
  "Indicative only — ERP pricing is quote-based and varies by modules, users and partner. Confirm with vendors.";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function estimateErpCost(tool: ErpTool, companySize: string | undefined): CostEstimate {
  const size = companySize && HEADCOUNT_BY_SIZE[companySize] ? companySize : "51-200";
  const headcount = HEADCOUNT_BY_SIZE[size]!;
  const users = Math.max(2, Math.round(headcount * 0.35));
  const seatNote = `Assumes ~${users} ERP users (ERP users are typically 30–40% of headcount) for a company your size`;

  let monthlyLow = 0;
  let monthlyHigh = 0;
  let basis = seatNote;
  let pricingModelLabel = PRICING_LABEL[tool.pricing_model];

  switch (tool.id) {
    case "netsuite":
      monthlyLow = monthlyHigh = 99 * users + 999;
      basis = `${seatNote}, at ~$99/user/month plus a ~$999/month base platform fee`;
      break;
    case "businesscentral":
      monthlyLow = 80 * users;
      monthlyHigh = 110 * users;
      basis = `${seatNote}, from Essentials (~$80) to Premium (~$110) per user/month`;
      break;
    case "zohoone":
      monthlyLow = monthlyHigh = 37 * headcount;
      basis = `Zoho One is licensed per employee — assumes ~${headcount} employees at ~$37/month`;
      break;
    case "erpnext":
      monthlyLow = 0;
      monthlyHigh = 25;
      basis = "No licence fee; the upper figure is ~$25/month managed hosting. Self-hosting instead means infrastructure and DevOps time";
      break;
    case "intacct":
      monthlyLow = 25000 / 12;
      monthlyHigh = 60000 / 12;
      pricingModelLabel = "Quote-based (estimated range)";
      basis = "Estimated range, quote-based: roughly $25,000–$60,000 per year depending on modules and entities";
      break;
    case "acumatica": {
      const i = SIZE_INDEX[size] ?? 2;
      const lowYr = 20000 + (80000 * i) / 5;
      const highYr = 20000 + (80000 * (i + 1)) / 5;
      monthlyLow = lowYr / 12;
      monthlyHigh = highYr / 12;
      pricingModelLabel = "Consumption-based (estimated range, quote-based)";
      basis = `Estimated range, quote-based: Acumatica prices on resources consumed rather than users (overall ~$20,000–$100,000 per year); for a company your size roughly ${money(lowYr)}–${money(highYr)} per year`;
      break;
    }
    case "infor_csi":
      monthlyLow = monthlyHigh = 100 * users;
      pricingModelLabel = "Quote-based (estimated)";
      basis = `${seatNote}. No published price — estimated, quote-based, using a comparable manufacturing ERP's ~$100/user/month`;
      break;
    default: {
      const price = LIST_PRICE[tool.id] ?? 0;
      monthlyLow = monthlyHigh = price * users;
      basis = `${seatNote}, at a starting list price of ~$${price}/user/month`;
    }
  }

  monthlyLow = Math.round(monthlyLow);
  monthlyHigh = Math.round(monthlyHigh);

  const multiplier = LOW_IMPLEMENTATION.has(tool.id) ? 2 : tool.implementation_cost_tier === "high" ? 3 : 2.5;
  const multLabel = multiplier === 2.5 ? "2–3x" : `${multiplier}x`;
  const implNote =
    monthlyHigh > 0
      ? ` One-off implementation is typically ${multLabel} the annual licence (roughly ${money(monthlyLow * 12 * multiplier)}–${money(monthlyHigh * 12 * multiplier)}).`
      : "";

  return {
    pricingModelLabel,
    costTierLabel: `${COST_LABEL[tool.tco_tier] ?? "Cost"} (tier ${tool.tco_tier}/5)`,
    monthlyLow,
    monthlyHigh,
    assumptionNote: `${basis}.${implNote} ${ERP_PRICING_DISCLAIMER}`,
    implementationCostTier: tool.implementation_cost_tier,
    timeToValue: tool.time_to_value,
    hiddenCosts: tool.hidden_costs,
    freeTierNote: tool.free_tier ? "Free or community edition available" : null,
  };
}
