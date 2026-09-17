import { BI_TOOLS, type BiTool } from "@/data/biTools";
import type { Answers } from "./questions";

export interface CriterionResult {
  key: string;
  label: string;
  answer: string;
  toolValue: string;
  weight: number;
  score: number;
  contribution: number;
  positive: string;
  caveat: string;
}

export interface MatchResult {
  tool: BiTool;
  finalScore: number;
  criteria: CriterionResult[];
  fits: string[];
  caveat: string | null;
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
  budget_fit: 0.2,
  report_builder_fit: 0.15,
  ux_complexity_fit: 0.15,
  embed_fit: 0.15,
  connector_richness_fit: 0.1,
  data_source_fit: 0.1,
  customization_fit: 0.1,
  security_soft_fit: 0.05,
};

const BUILDER_MAP: Record<string, Record<string, number>> = {
  "Pure drag-and-drop, no SQL": { dragdrop: 1.0, hybrid: 0.6, sql: 0.1 },
  "Comfortable writing SQL": { sql: 1.0, hybrid: 0.9, dragdrop: 0.7 },
  "Need both options available": { hybrid: 1.0, dragdrop: 0.5, sql: 0.5 },
};

const UX_MAP: Record<string, Record<string, number>> = {
  "No dedicated data person": { simple: 1.0, moderate: 0.5, steep: 0.1 },
  "Part-time / shared analyst": { simple: 0.8, moderate: 1.0, steep: 0.5 },
  "One dedicated analyst": { simple: 0.6, moderate: 1.0, steep: 0.9 },
  "Full data team": { simple: 0.5, moderate: 0.8, steep: 1.0 },
};

const CUSTOM_MAP: Record<string, Record<string, number>> = {
  "Works well out of the box": { ootb: 1.0, configurable: 0.6, composable: 0.2 },
  "Happy to configure/customize to fit our process": { ootb: 0.5, configurable: 0.9, composable: 1.0 },
};

const BUILDER_LABEL: Record<string, string> = {
  dragdrop: "Drag-and-drop builder",
  hybrid: "Drag-and-drop + SQL",
  sql: "SQL-first",
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
const TIER_LABEL: Record<string, string> = { high: "Wide connector library", medium: "Solid connector library", low: "Limited connectors" };
const BREADTH_LABEL: Record<string, string> = { broad: "Connects to a broad range of sources", medium: "Covers common sources", narrow: "Narrow source support" };
const COST_LABEL = ["", "Very low cost", "Low cost", "Mid-range cost", "Premium cost", "Enterprise cost"];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function matchTools(answers: Answers): MatchResult[] {
  const rls = answers["row_level_security_required"] as string | undefined;
  const compliance = asArray(answers["compliance_needs"]).filter(
    (c) => c !== "Not sure" && c !== "None required",
  );

  let pool = BI_TOOLS.slice();
  if (rls === "Yes") pool = pool.filter((t) => t.row_level_security);
  if (pool.length === 0) pool = BI_TOOLS.slice();

  let complianceIsHardFilter = compliance.length > 0;
  if (complianceIsHardFilter) {
    const filtered = pool.filter((t) =>
      compliance.every((c) => t.security_certs.includes(CERT_MAP[c] ?? c)),
    );
    if (filtered.length > 0) {
      pool = filtered;
    } else {
      complianceIsHardFilter = false;
    }
  }

  const budget = answers["budget_range"] as string | undefined;
  const embed = answers["embed_needed"] as string | undefined;
  const builderPref = (answers["report_builder_preference"] as string) ?? "Need both options available";
  const maturity = (answers["technical_maturity"] as string) ?? "One dedicated analyst";
  const customPref = (answers["customization_preference"] as string) ?? "Works well out of the box";
  const source = answers["primary_data_source"] as string | undefined;

  const useBudget = !!budget && budget !== "Not sure yet";
  const useEmbed = !!embed && embed.startsWith("Yes");
  const useSecuritySoft = !complianceIsHardFilter;

  const active: string[] = ["report_builder_fit", "ux_complexity_fit", "connector_richness_fit", "data_source_fit", "customization_fit"];
  if (useBudget) active.push("budget_fit");
  if (useEmbed) active.push("embed_fit");
  if (useSecuritySoft) active.push("security_soft_fit");

  const total = active.reduce((s, k) => s + (BASE_WEIGHTS[k] ?? 0), 0);
  const weights: Record<string, number> = {};
  active.forEach((k) => (weights[k] = (BASE_WEIGHTS[k] ?? 0) / total));

  const results: MatchResult[] = pool.map((tool) => {
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
        weight: (weights["budget_fit"] ?? 0),
        score,
        positive: "Sits comfortably inside your budget range",
        caveat: "Likely to cost more than your stated budget",
      });
    }

    push({
      key: "report_builder_fit",
      label: "Report building",
      answer: builderPref,
      toolValue: BUILDER_LABEL[tool.report_builder] ?? "",
      weight: (weights["report_builder_fit"] ?? 0),
      score: BUILDER_MAP[builderPref]?.[tool.report_builder] ?? 0.5,
      positive: `${BUILDER_LABEL[tool.report_builder] ?? ""} matches how your team wants to work`,
      caveat: `Report building is ${(BUILDER_LABEL[tool.report_builder] ?? "").toLowerCase()}, which isn't how you prefer to work`,
    });

    push({
      key: "ux_complexity_fit",
      label: "Learning curve",
      answer: maturity,
      toolValue: UX_LABEL[tool.ux_complexity] ?? "",
      weight: (weights["ux_complexity_fit"] ?? 0),
      score: UX_MAP[maturity]?.[tool.ux_complexity] ?? 0.5,
      positive: "Learning curve suits the skills on your team today",
      caveat: "May be demanding for the data skills you have in-house",
    });

    if (useEmbed) {
      push({
        key: "embed_fit",
        label: "Embedding",
        answer: "Need to embed dashboards",
        toolValue: tool.embed_capability ? "Supports embedding" : "No embedding",
        weight: (weights["embed_fit"] ?? 0),
        score: tool.embed_capability ? 1 : 0,
        positive: "Supports embedding dashboards in your own product",
        caveat: "Doesn't support embedding into your own product",
      });
    }

    push({
      key: "connector_richness_fit",
      label: "Connectors",
      answer: "Connector coverage",
      toolValue: TIER_LABEL[tool.connector_tier] ?? "",
      weight: (weights["connector_richness_fit"] ?? 0),
      score: tool.connector_tier === "high" ? 1 : tool.connector_tier === "medium" ? 0.6 : 0.3,
      positive: "Wide library of ready-made connectors",
      caveat: "Connector coverage is thinner than the leaders here",
    });

    const multi = source === "Multiple disparate sources";
    push({
      key: "data_source_fit",
      label: "Data sources",
      answer: source ?? "Not specified",
      toolValue: BREADTH_LABEL[tool.data_source_breadth] ?? "",
      weight: (weights["data_source_fit"] ?? 0),
      score: multi
        ? tool.data_source_breadth === "broad" ? 1 : tool.data_source_breadth === "medium" ? 0.5 : 0.1
        : tool.data_source_breadth === "broad" ? 1 : tool.data_source_breadth === "medium" ? 0.8 : 0.6,
      positive: "Handles the kind of data sources you're working with",
      caveat: "Source coverage may be tight for where your data lives",
    });

    push({
      key: "customization_fit",
      label: "Customization",
      answer: customPref,
      toolValue: CUSTOM_LABEL[tool.customization_level] ?? "",
      weight: (weights["customization_fit"] ?? 0),
      score: CUSTOM_MAP[customPref]?.[tool.customization_level] ?? 0.5,
      positive: "Set-up effort matches what you're willing to invest",
      caveat: "Set-up style doesn't match how hands-on you want to be",
    });

    if (useSecuritySoft) {
      push({
        key: "security_soft_fit",
        label: "Security certifications",
        answer: "No hard compliance requirement",
        toolValue: tool.security_certs.length ? tool.security_certs.join(", ") : "None published",
        weight: (weights["security_soft_fit"] ?? 0),
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
    };
  });

  return results.sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
}
