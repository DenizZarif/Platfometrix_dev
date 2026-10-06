import { ERP_TOOLS, type ErpTool } from "@/data/erpTools";
import type { Answers } from "./questions";
import type { CriterionResult } from "./matcher";
import type { CostEstimate } from "./costEstimate";
import { estimateErpCost } from "./costEstimateErp";

export interface ErpMatchResult {
  tool: ErpTool;
  finalScore: number;
  criteria: CriterionResult[];
  fits: string[];
  caveat: string | null;
  costEstimate: CostEstimate;
}

const CERT_MAP: Record<string, string> = {
  "SOC 2": "SOC2",
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  "ISO 27001": "ISO27001",
};

const BUDGET_TIER: Record<string, number> = {
  "Free tools only": 1,
  "Under $500/mo": 2,
  "$500-2,000/mo": 3,
  "$2,000-10,000/mo": 4,
  "$10,000+/mo": 5,
};

const BASE_WEIGHTS: Record<string, number> = {
  budget_fit: 0.18,
  size_fit: 0.12,
  industry_fit: 0.18,
  customization_fit: 0.1,
  ux_complexity_fit: 0.1,
  entity_fit: 0.08,
  connector_richness_fit: 0.06,
  implementation_effort_fit: 0.08,
  security_soft_fit: 0.05,
};

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const UX_MAP: Record<string, Record<string, number>> = {
  "No dedicated admin — it needs to be simple": { simple: 1.0, moderate: 0.5, steep: 0.1 },
  "Part-time admin or finance lead": { simple: 0.8, moderate: 1.0, steep: 0.5 },
  "One dedicated systems administrator": { simple: 0.6, moderate: 1.0, steep: 0.9 },
  "A full IT / systems team": { simple: 0.5, moderate: 0.8, steep: 1.0 },
};

const EFFORT_MAP: Record<string, Record<string, number>> = {
  "No dedicated admin — it needs to be simple": { low: 1.0, medium: 0.5, high: 0.15 },
  "Part-time admin or finance lead": { low: 1.0, medium: 0.8, high: 0.4 },
  "One dedicated systems administrator": { low: 0.8, medium: 1.0, high: 0.7 },
  "A full IT / systems team": { low: 0.7, medium: 0.9, high: 1.0 },
};

const CUSTOM_MAP: Record<string, Record<string, number>> = {
  "Works well out of the box": { ootb: 1.0, configurable: 0.6, composable: 0.2 },
  "Happy to configure/customize to fit our process": { ootb: 0.5, configurable: 0.9, composable: 1.0 },
};

const UX_LABEL: Record<string, string> = {
  simple: "Easy to pick up",
  moderate: "Moderate learning curve",
  steep: "Steep learning curve",
};
const CUSTOM_LABEL: Record<string, string> = {
  ootb: "Works out of the box",
  configurable: "Configurable",
  composable: "Highly composable",
};
const TIER_LABEL: Record<string, string> = {
  high: "Wide integration library",
  medium: "Solid integration library",
  low: "Limited integrations",
};
const EFFORT_LABEL: Record<string, string> = {
  low: "Light implementation",
  medium: "Moderate implementation",
  high: "Heavy, partner-led implementation",
};
const MFG_LABEL: Record<string, string> = {
  none: "No manufacturing module",
  basic: "Basic manufacturing",
  advanced: "Advanced manufacturing",
};
const COST_LABEL = ["", "Very low cost", "Low cost", "Mid-range cost", "Premium cost", "Enterprise cost"];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function industryScore(tool: ErpTool, need: string): { score: number; value: string } {
  const strengths = tool.industry_strength.join(", ");
  if (need.startsWith("Manufacturing")) {
    const score = tool.manufacturing_depth === "advanced" ? 1 : tool.manufacturing_depth === "basic" ? 0.4 : 0;
    return { score, value: MFG_LABEL[tool.manufacturing_depth] ?? "" };
  }
  if (need.startsWith("Finance")) return { score: tool.industry_strength.includes("finance") ? 1 : 0.3, value: `Strong in: ${strengths}` };
  if (need.startsWith("Distribution")) return { score: tool.industry_strength.includes("distribution") ? 1 : 0.3, value: `Strong in: ${strengths}` };
  if (need.startsWith("Services")) return { score: tool.industry_strength.includes("services") ? 1 : 0.3, value: `Strong in: ${strengths}` };
  const n = tool.industry_strength.length;
  return { score: n >= 3 ? 1 : n === 2 ? 0.7 : 0.4, value: `Strong in: ${strengths}` };
}

export function matchErpTools(
  answers: Answers,
  weightOverrides?: Partial<Record<string, number>>,
): ErpMatchResult[] {
  const compliance = asArray(answers["compliance_needs"]).filter(
    (c) => c !== "Not sure" && c !== "None required",
  );

  let pool = ERP_TOOLS.slice();

  let complianceIsHardFilter = compliance.length > 0;
  if (complianceIsHardFilter) {
    const filtered = pool.filter((t) =>
      compliance.every((c) => t.security_certs.includes(CERT_MAP[c] ?? c)),
    );
    if (filtered.length > 0) pool = filtered;
    else complianceIsHardFilter = false;
  }

  const deploymentPref = answers["erp_deployment_pref"] as string | undefined;
  if (deploymentPref?.startsWith("We need")) {
    const filtered = pool.filter(
      (t) => t.deployment_options.includes("on_prem") || t.deployment_options.includes("hybrid"),
    );
    if (filtered.length > 0) pool = filtered;
  }

  const budget = answers["budget_range"] as string | undefined;
  const size = (answers["company_size"] as string) ?? "51-200";
  const admin = (answers["erp_admin_capacity"] as string) ?? "Part-time admin or finance lead";
  const need = (answers["erp_primary_need"] as string) ?? "A bit of everything — general business";
  const entity = answers["erp_entity_structure"] as string | undefined;
  const customPref = (answers["customization_preference"] as string) ?? "Works well out of the box";

  const useBudget = !!budget && budget !== "Not sure yet";
  const useEntity = !!entity && entity.startsWith("Multiple");
  const useSecuritySoft = !complianceIsHardFilter;

  const active: string[] = [
    "size_fit",
    "industry_fit",
    "customization_fit",
    "ux_complexity_fit",
    "connector_richness_fit",
    "implementation_effort_fit",
  ];
  if (useBudget) active.push("budget_fit");
  if (useEntity) active.push("entity_fit");
  if (useSecuritySoft) active.push("security_soft_fit");

  const rawWeight = (k: string) => weightOverrides?.[k] ?? BASE_WEIGHTS[k] ?? 0;
  const total = active.reduce((s, k) => s + rawWeight(k), 0);
  const weights: Record<string, number> = {};
  active.forEach((k) => (weights[k] = total > 0 ? rawWeight(k) / total : 0));

  const sizeIdx = SIZES.indexOf(size);

  const results: ErpMatchResult[] = pool.map((tool) => {
    const criteria: CriterionResult[] = [];
    const push = (c: Omit<CriterionResult, "contribution">) =>
      criteria.push({ ...c, contribution: c.weight * c.score });

    if (useBudget) {
      const maxTier = BUDGET_TIER[budget!] ?? 5;
      const score = tool.tco_tier <= maxTier ? 1 : tool.tco_tier === maxTier + 1 ? 0.5 : 0;
      push({
        key: "budget_fit",
        label: "Budget",
        answer: budget!,
        toolValue: `${COST_LABEL[tool.tco_tier] ?? ""} (tier ${tool.tco_tier}/5)`,
        weight: weights["budget_fit"] ?? 0,
        score,
        positive: "Sits comfortably inside your budget range",
        caveat: "Likely to cost more than your stated budget",
      });
    }

    const sizeScore = tool.sweet_spot_sizes.includes(size)
      ? 1
      : tool.sweet_spot_sizes.some((s) => Math.abs(SIZES.indexOf(s) - sizeIdx) === 1)
        ? 0.5
        : 0.15;
    push({
      key: "size_fit",
      label: "Company size",
      answer: size,
      toolValue: `Best for ${tool.sweet_spot_sizes.join(", ")} employees`,
      weight: weights["size_fit"] ?? 0,
      score: sizeScore,
      positive: "Built for companies of your size",
      caveat: "Usually aimed at larger or smaller companies than yours",
    });

    const ind = industryScore(tool, need);
    push({
      key: "industry_fit",
      label: "Core business need",
      answer: need,
      toolValue: ind.value,
      weight: weights["industry_fit"] ?? 0,
      score: ind.score,
      positive: "Strong at the thing you most need an ERP to do",
      caveat: "Not its strongest area for what you most need",
    });

    push({
      key: "customization_fit",
      label: "Customization",
      answer: customPref,
      toolValue: CUSTOM_LABEL[tool.customization_level] ?? "",
      weight: weights["customization_fit"] ?? 0,
      score: CUSTOM_MAP[customPref]?.[tool.customization_level] ?? 0.5,
      positive: "Set-up effort matches what you're willing to invest",
      caveat: "Set-up style doesn't match how hands-on you want to be",
    });

    push({
      key: "ux_complexity_fit",
      label: "Learning curve",
      answer: admin,
      toolValue: UX_LABEL[tool.ux_complexity] ?? "",
      weight: weights["ux_complexity_fit"] ?? 0,
      score: UX_MAP[admin]?.[tool.ux_complexity] ?? 0.5,
      positive: "Learning curve suits who'll run it day to day",
      caveat: "May be demanding for the people who'd run it",
    });

    if (useEntity) {
      push({
        key: "entity_fit",
        label: "Multi-entity & consolidation",
        answer: "Multiple entities and/or currencies",
        toolValue: tool.multi_entity === "advanced" ? "Advanced multi-entity & consolidation" : "Basic multi-entity support",
        weight: weights["entity_fit"] ?? 0,
        score: tool.multi_entity === "advanced" ? 1 : 0.4,
        positive: "Handles multiple entities and consolidation well",
        caveat: "Multi-entity consolidation is limited",
      });
    }

    push({
      key: "connector_richness_fit",
      label: "Integrations",
      answer: "Integration coverage",
      toolValue: TIER_LABEL[tool.connector_tier] ?? "",
      weight: weights["connector_richness_fit"] ?? 0,
      score: tool.connector_tier === "high" ? 1 : tool.connector_tier === "medium" ? 0.6 : 0.3,
      positive: "Wide library of ready-made integrations",
      caveat: "Integration coverage is thinner than the leaders here",
    });

    push({
      key: "implementation_effort_fit",
      label: "Implementation effort",
      answer: admin,
      toolValue: EFFORT_LABEL[tool.implementation_cost_tier] ?? "",
      weight: weights["implementation_effort_fit"] ?? 0,
      score: EFFORT_MAP[admin]?.[tool.implementation_cost_tier] ?? 0.6,
      positive: "Rollout effort matches what your team can take on",
      caveat: "Rollout is heavier than your team can comfortably absorb",
    });

    if (useSecuritySoft) {
      push({
        key: "security_soft_fit",
        label: "Security certifications",
        answer: "No hard compliance requirement",
        toolValue: tool.security_certs.length ? tool.security_certs.join(", ") : "None published",
        weight: weights["security_soft_fit"] ?? 0,
        score: Math.min(1, tool.security_certs.length / 3),
        positive: "Strong set of published security certifications",
        caveat: "Few published security certifications",
      });
    }

    const finalScore = Math.round(100 * criteria.reduce((s, c) => s + c.contribution, 0));
    const byContribution = criteria.slice().sort((a, b) => b.contribution - a.contribution);
    const lowest = criteria.slice().sort((a, b) => a.score - b.score)[0];

    return {
      tool,
      finalScore,
      criteria,
      fits: byContribution.slice(0, 2).map((c) => c.positive),
      caveat: lowest && lowest.score < 1 ? lowest.caveat : null,
      costEstimate: estimateErpCost(tool, answers["company_size"] as string | undefined),
    };
  });

  return results.sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
}
