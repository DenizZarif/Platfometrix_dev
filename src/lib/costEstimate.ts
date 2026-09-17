import type { BiTool } from "@/data/biTools";
import type { CrmTool } from "@/data/crmTools";
import type { WarehouseTool } from "@/data/warehouseTools";

export interface CostEstimate {
  pricingModelLabel: string;
  costTierLabel: string;
  monthlyLow: number;
  monthlyHigh: number;
  assumptionNote: string;
  implementationCostTier: "low" | "medium" | "high";
  timeToValue: "days" | "weeks" | "months";
  hiddenCosts: string[];
  freeTierNote: string | null;
}

const BI_SEAT_BAND: [number, number][] = [
  [0, 15],
  [15, 40],
  [40, 80],
  [80, 150],
  [150, 300],
];

const CRM_SEAT_BAND: [number, number][] = [
  [0, 12],
  [12, 30],
  [30, 60],
  [60, 120],
  [120, 250],
];

const WAREHOUSE_BASE_BAND: [number, number][] = [
  [0, 50],
  [50, 200],
  [200, 800],
  [800, 3000],
  [3000, 10000],
];

const SEATS_BY_COMPANY_SIZE: Record<string, number> = {
  "1-10": 5,
  "11-50": 15,
  "51-200": 40,
  "201-1000": 100,
  "1000+": 250,
};

const WAREHOUSE_SCALE_MULTIPLIER: Record<string, number> = {
  "Small (<100GB)": 1,
  "Medium (100GB-10TB)": 3,
  "Large (10TB-1PB)": 8,
  "Very large (1PB+)": 20,
};

const COST_LABEL = ["", "Very low cost", "Low cost", "Mid-range cost", "Premium cost", "Enterprise cost"];

const PRICING_LABEL: Record<string, string> = {
  "per-seat": "Per-seat",
  consumption: "Consumption-based",
  tiered: "Tiered plans",
  free: "Free / open-source",
};

function pricingLabel(model: string): string {
  return PRICING_LABEL[model] ?? model;
}

function costTierLabel(tier: number): string {
  return `${COST_LABEL[tier] ?? "Cost"} (tier ${tier}/5)`;
}

interface CuratedCost {
  implementation_cost_tier: "low" | "medium" | "high";
  time_to_value: "days" | "weeks" | "months";
  hidden_costs: string[];
}

function seatBased(
  tool: { pricing_model: string; tco_tier: number; free_tier: boolean } & CuratedCost,
  companySize: string | undefined,
  bands: [number, number][],
): CostEstimate {
  const seats = (companySize ? SEATS_BY_COMPANY_SIZE[companySize] : undefined) ?? 40;
  const band = bands[tool.tco_tier - 1] ?? [0, 0];
  let monthlyLow = band[0] * seats;
  let monthlyHigh = band[1] * seats;
  let assumptionNote = `Assumes ~${seats} seats for a company your size`;

  if (tool.pricing_model === "consumption") {
    monthlyLow = Math.round(monthlyLow * 1.5);
    monthlyHigh = Math.round(monthlyHigh * 1.5);
    assumptionNote = `Usage-based pricing — costs vary with usage; assumes ~${seats} seats for a company your size`;
  }
  if (tool.pricing_model === "free") {
    monthlyLow = 0;
    assumptionNote = `Free to run; the upper figure is what you'd pay if you outgrow the free plan at ~${seats} seats`;
  }

  return {
    pricingModelLabel: pricingLabel(tool.pricing_model),
    costTierLabel: costTierLabel(tool.tco_tier),
    monthlyLow,
    monthlyHigh,
    assumptionNote,
    implementationCostTier: tool.implementation_cost_tier,
    timeToValue: tool.time_to_value,
    hiddenCosts: tool.hidden_costs,
    freeTierNote: tool.free_tier ? "Free tier available for light usage" : null,
  };
}

export function estimateBiCost(tool: BiTool, companySize: string | undefined): CostEstimate {
  return seatBased(tool, companySize, BI_SEAT_BAND);
}

export function estimateCrmCost(tool: CrmTool, companySize: string | undefined): CostEstimate {
  return seatBased(tool, companySize, CRM_SEAT_BAND);
}

export function estimateWarehouseCost(
  tool: WarehouseTool,
  dataVolumeScale: string | undefined,
): CostEstimate {
  const multiplier = (dataVolumeScale ? WAREHOUSE_SCALE_MULTIPLIER[dataVolumeScale] : undefined) ?? 3;
  const band = WAREHOUSE_BASE_BAND[tool.tco_tier - 1] ?? [0, 0];
  let monthlyLow = band[0] * multiplier;
  let monthlyHigh = band[1] * multiplier;
  let assumptionNote = `Assumes a ${dataVolumeScale ?? "medium"} workload, as you indicated`;

  if (tool.pricing_model === "consumption") {
    monthlyLow = Math.round(monthlyLow * 1.5);
    monthlyHigh = Math.round(monthlyHigh * 1.5);
    assumptionNote = `Usage-based pricing — costs vary with usage; assumes a ${dataVolumeScale ?? "medium"} workload`;
  }
  if (tool.pricing_model === "free") {
    monthlyLow = 0;
    assumptionNote = `Free to run; the upper figure covers infrastructure if you outgrow the free setup at a ${dataVolumeScale ?? "medium"} workload`;
  }

  return {
    pricingModelLabel: pricingLabel(tool.pricing_model),
    costTierLabel: costTierLabel(tool.tco_tier),
    monthlyLow,
    monthlyHigh,
    assumptionNote,
    implementationCostTier: tool.implementation_cost_tier,
    timeToValue: tool.time_to_value,
    hiddenCosts: tool.hidden_costs,
    freeTierNote: tool.free_tier ? "Free tier available for light usage" : null,
  };
}
