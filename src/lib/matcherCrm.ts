import { CRM_TOOLS, type CrmTool } from "@/data/crmTools";
import type { Answers } from "./questions";
import type { CriterionResult } from "./matcher";
import { estimateCrmCost, type CostEstimate } from "./costEstimate";

export interface CrmMatchResult {
  tool: CrmTool;
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
  budget_fit: 0.2,
  customization_fit: 0.15,
  ux_complexity_fit: 0.15,
  email_calling_fit: 0.12,
  marketing_automation_fit: 0.1,
  mobile_fit: 0.1,
  reporting_fit: 0.08,
  connector_richness_fit: 0.05,
  security_soft_fit: 0.05,
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
const MARKETING_LABEL: Record<string, string> = {
  none: "No marketing automation",
  basic: "Basic marketing automation",
  advanced: "Advanced marketing automation",
};
const COST_LABEL = ["", "Very low cost", "Low cost", "Mid-range cost", "Premium cost", "Enterprise cost"];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function matchCrmTools(
  answers: Answers,
  weightOverrides?: Partial<Record<string, number>>,
): CrmMatchResult[] {
  const compliance = asArray(answers["compliance_needs"]).filter(
    (c) => c !== "Not sure" && c !== "None required",
  );

  let pool = CRM_TOOLS.slice();

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
  const maturity = (answers["technical_maturity"] as string) ?? "One dedicated analyst";
  const customPref = (answers["customization_preference"] as string) ?? "Works well out of the box";
  const emailNeed = answers["email_calling_need"] as string | undefined;
  const marketingNeed = answers["marketing_automation_need"] as string | undefined;
  const mobileUsage = (answers["mobile_usage"] as string) ?? "Team mostly works from a desk";
  const reportingNeed = (answers["reporting_need"] as string) ?? "Basic pipeline visibility is enough";

  const useBudget = !!budget && budget !== "Not sure yet";
  const useEmail = !!emailNeed && emailNeed.startsWith("Yes");
  const useMarketing = !!marketingNeed && marketingNeed.startsWith("Yes");
  const useSecuritySoft = !complianceIsHardFilter;

  const active: string[] = [
    "customization_fit",
    "ux_complexity_fit",
    "mobile_fit",
    "reporting_fit",
    "connector_richness_fit",
  ];
  if (useBudget) active.push("budget_fit");
  if (useEmail) active.push("email_calling_fit");
  if (useMarketing) active.push("marketing_automation_fit");
  if (useSecuritySoft) active.push("security_soft_fit");

  const rawWeight = (k: string) => weightOverrides?.[k] ?? BASE_WEIGHTS[k] ?? 0;
  const total = active.reduce((s, k) => s + rawWeight(k), 0);
  const weights: Record<string, number> = {};
  active.forEach((k) => (weights[k] = rawWeight(k) / total));

  const fieldHeavy = mobileUsage.startsWith("Team is often in the field");
  const advancedReporting = reportingNeed.startsWith("Need advanced");

  const results: CrmMatchResult[] = pool.map((tool) => {
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
      answer: maturity,
      toolValue: UX_LABEL[tool.ux_complexity] ?? "",
      weight: weights["ux_complexity_fit"] ?? 0,
      score: UX_MAP[maturity]?.[tool.ux_complexity] ?? 0.5,
      positive: "Learning curve suits the skills on your team today",
      caveat: "May be demanding for the skills you have in-house",
    });

    if (useEmail) {
      push({
        key: "email_calling_fit",
        label: "Email & calling",
        answer: "Need built-in email sync + calling",
        toolValue: tool.email_calling_builtin ? "Built-in email sync and calling" : "No built-in email or calling",
        weight: weights["email_calling_fit"] ?? 0,
        score: tool.email_calling_builtin ? 1 : 0,
        positive: "Built-in calling and email sync included",
        caveat: "No built-in calling — you'd need a separate tool",
      });
    }

    if (useMarketing) {
      push({
        key: "marketing_automation_fit",
        label: "Marketing automation",
        answer: "Want marketing automation bundled in",
        toolValue: MARKETING_LABEL[tool.marketing_automation_tier] ?? "",
        weight: weights["marketing_automation_fit"] ?? 0,
        score:
          tool.marketing_automation_tier === "advanced"
            ? 1
            : tool.marketing_automation_tier === "basic"
              ? 0.5
              : 0,
        positive: "Marketing automation comes bundled in",
        caveat: "Marketing automation is thin — you'd likely add another tool",
      });
    }

    push({
      key: "mobile_fit",
      label: "Mobile app",
      answer: mobileUsage,
      toolValue: tool.mobile_app_quality === "full" ? "Full-featured mobile app" : "Basic mobile app",
      weight: weights["mobile_fit"] ?? 0,
      score:
        tool.mobile_app_quality === "full" ? 1 : fieldHeavy ? 0.4 : 0.8,
      positive: "Mobile experience matches how your team works",
      caveat: "Mobile app is basic for a team that works away from a desk",
    });

    push({
      key: "reporting_fit",
      label: "Reporting depth",
      answer: reportingNeed,
      toolValue: tool.reporting_depth === "advanced" ? "Advanced reporting & forecasting" : "Basic pipeline reporting",
      weight: weights["reporting_fit"] ?? 0,
      score: tool.reporting_depth === "advanced" ? 1 : advancedReporting ? 0.4 : 0.8,
      positive: "Reporting goes as deep as you need",
      caveat: "Reporting stays at pipeline level, short of forecasting depth",
    });

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
      costEstimate: estimateCrmCost(tool, answers["company_size"] as string | undefined),
    };
  });

  return results.sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
}
