import { WAREHOUSE_TOOLS, type WarehouseTool } from "@/data/warehouseTools";
import type { Answers } from "./questions";
import type { CriterionResult } from "./matcher";
import { estimateWarehouseCost, type CostEstimate } from "./costEstimate";

export interface WarehouseMatchResult {
  tool: WarehouseTool;
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
  data_scale_fit: 0.16,
  workload_fit: 0.14,
  ux_complexity_fit: 0.13,
  deployment_fit: 0.12,
  cloud_provider_fit: 0.09,
  pipeline_ingestion_fit: 0.08,
  real_time_fit: 0.05,
  customization_fit: 0.03,
  security_soft_fit: 0.02,
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

const DEPLOY_MAP: Record<string, Record<string, number>> = {
  "Fully managed cloud (no infra to manage)": { cloud: 1.0, hybrid: 0.6, self_hosted: 0.1 },
  "Hybrid / some on-prem needed": { hybrid: 1.0, cloud: 0.6, self_hosted: 0.7 },
};

const SCALE_NUM: Record<string, number> = {
  small: 1,
  medium: 2,
  large: 3,
  very_large: 4,
};

const ANSWER_SCALE_NUM: Record<string, number> = {
  "Small (<100GB)": 1,
  "Medium (100GB-10TB)": 2,
  "Large (10TB-1PB)": 3,
  "Very large (1PB+)": 4,
};

const WORKLOAD_MAP: Record<string, string> = {
  "BI/reporting queries": "bi_reporting",
  "Real-time / streaming analytics": "real_time_streaming",
  "Data science & ML": "data_science_ml",
  "Ad-hoc exploration by many analysts": "adhoc_exploration",
};

const CLOUD_MAP: Record<string, string> = {
  AWS: "aws",
  "Google Cloud": "gcp",
  Azure: "azure",
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
const DEPLOY_LABEL: Record<string, string> = {
  cloud: "Fully managed cloud",
  hybrid: "Cloud or on-prem (hybrid)",
  self_hosted: "Self-hosted",
};
const SCALE_LABEL: Record<string, string> = {
  small: "Built for small data volumes",
  medium: "Comfortable up to mid-size volumes",
  large: "Handles large volumes",
  very_large: "Handles petabyte-scale volumes",
};
const INGEST_LABEL: Record<string, string> = {
  high: "Strong built-in ingestion tooling",
  medium: "Some built-in ingestion tooling",
  low: "Minimal built-in ingestion",
};
const CLOUD_LABEL: Record<string, string> = {
  aws: "AWS",
  gcp: "Google Cloud",
  azure: "Azure",
  oci: "Oracle Cloud",
  ibm: "IBM Cloud",
};
const COST_LABEL = ["", "Very low cost", "Low cost", "Mid-range cost", "Premium cost", "Enterprise cost"];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function matchWarehouseTools(
  answers: Answers,
  weightOverrides?: Partial<Record<string, number>>,
): WarehouseMatchResult[] {
  const compliance = asArray(answers["compliance_needs"]).filter(
    (c) => c !== "Not sure" && c !== "None required",
  );

  let pool = WAREHOUSE_TOOLS.slice();

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
  const deployPref = (answers["deployment_model_preference"] as string) ?? "Fully managed cloud (no infra to manage)";
  const cloudPref = answers["primary_cloud_provider"] as string | undefined;
  const volume = (answers["data_volume_scale"] as string) ?? "Medium (100GB-10TB)";
  const workload = (answers["primary_workload"] as string) ?? "BI/reporting queries";
  const ingestNeed = answers["pipeline_ingestion_need"] as string | undefined;
  const realTimeNeed = answers["real_time_need"] as string | undefined;

  let selfHostedIsHardFilter = deployPref === "We want full control (self-hosted)";
  if (selfHostedIsHardFilter) {
    const filtered = pool.filter(
      (t) => t.deployment_model === "hybrid" || t.deployment_model === "self_hosted",
    );
    if (filtered.length > 0) {
      pool = filtered;
    } else {
      selfHostedIsHardFilter = false;
    }
  }

  const useBudget = !!budget && budget !== "Not sure yet";
  const useDeployment = !selfHostedIsHardFilter;
  const useCloud = !!cloudPref && cloudPref !== "None — we're not cloud-native yet";
  const useIngest = !!ingestNeed && ingestNeed.startsWith("Yes");
  const useRealTime = !!realTimeNeed && realTimeNeed.startsWith("Yes");
  const useSecuritySoft = !complianceIsHardFilter;

  const active: string[] = [
    "data_scale_fit",
    "workload_fit",
    "ux_complexity_fit",
    "customization_fit",
  ];
  if (useBudget) active.push("budget_fit");
  if (useDeployment) active.push("deployment_fit");
  if (useCloud) active.push("cloud_provider_fit");
  if (useIngest) active.push("pipeline_ingestion_fit");
  if (useRealTime) active.push("real_time_fit");
  if (useSecuritySoft) active.push("security_soft_fit");

  const rawWeight = (k: string) => weightOverrides?.[k] ?? BASE_WEIGHTS[k] ?? 0;
  const total = active.reduce((s, k) => s + rawWeight(k), 0);
  const weights: Record<string, number> = {};
  active.forEach((k) => (weights[k] = rawWeight(k) / total));

  const buyerTier = ANSWER_SCALE_NUM[volume] ?? 2;
  const workloadKey = WORKLOAD_MAP[workload] ?? "bi_reporting";
  const cloudKey = cloudPref ? CLOUD_MAP[cloudPref] : undefined;

  const results: WarehouseMatchResult[] = pool.map((tool) => {
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

    const toolTier = SCALE_NUM[tool.scale_tier] ?? 2;
    push({
      key: "data_scale_fit",
      label: "Data scale",
      answer: volume,
      toolValue: SCALE_LABEL[tool.scale_tier] ?? "",
      weight: weights["data_scale_fit"] ?? 0,
      score: toolTier >= buyerTier ? 1 : toolTier === buyerTier - 1 ? 0.4 : 0.1,
      positive: "Comfortably handles the scale you described",
      caveat: "May strain at the data volume you're expecting",
    });

    push({
      key: "workload_fit",
      label: "Main workload",
      answer: workload,
      toolValue: tool.workload_strengths
        .map((w) => w.replace(/_/g, " "))
        .join(", "),
      weight: weights["workload_fit"] ?? 0,
      score: tool.workload_strengths.includes(workloadKey) ? 1 : 0.4,
      positive: "Purpose-built for the workload you care about most",
      caveat: "Your main workload isn't where this platform is strongest",
    });

    push({
      key: "ux_complexity_fit",
      label: "Learning curve",
      answer: maturity,
      toolValue: UX_LABEL[tool.ux_complexity] ?? "",
      weight: weights["ux_complexity_fit"] ?? 0,
      score: UX_MAP[maturity]?.[tool.ux_complexity] ?? 0.5,
      positive: "Learning curve suits the skills on your team today",
      caveat: "May be demanding for the data skills you have in-house",
    });

    if (useDeployment) {
      push({
        key: "deployment_fit",
        label: "Deployment",
        answer: deployPref,
        toolValue: DEPLOY_LABEL[tool.deployment_model] ?? "",
        weight: weights["deployment_fit"] ?? 0,
        score: DEPLOY_MAP[deployPref]?.[tool.deployment_model] ?? 0.5,
        positive: "Runs the way you want to operate it",
        caveat: "Deployment model doesn't match how you want to run things",
      });
    }

    if (useCloud) {
      const multi = cloudPref === "Multi-cloud / no preference";
      const score = multi
        ? tool.cloud_providers.length >= 2
          ? 1
          : 0.5
        : cloudKey && tool.cloud_providers.includes(cloudKey)
          ? 1
          : 0.3;
      push({
        key: "cloud_provider_fit",
        label: "Cloud provider",
        answer: cloudPref!,
        toolValue: tool.cloud_providers.map((p) => CLOUD_LABEL[p] ?? p).join(", "),
        weight: weights["cloud_provider_fit"] ?? 0,
        score,
        positive: "Runs natively on the cloud you already use",
        caveat: "Doesn't run natively on your primary cloud",
      });
    }

    if (useIngest) {
      push({
        key: "pipeline_ingestion_fit",
        label: "Built-in ingestion",
        answer: "Want strong built-in ingestion/pipelines",
        toolValue: INGEST_LABEL[tool.native_ingestion_tier] ?? "",
        weight: weights["pipeline_ingestion_fit"] ?? 0,
        score:
          tool.native_ingestion_tier === "high"
            ? 1
            : tool.native_ingestion_tier === "medium"
              ? 0.6
              : 0.2,
        positive: "Built-in ingestion tooling covers most pipeline needs",
        caveat: "Thin on native ingestion — you'd likely pair this with a separate ELT tool",
      });
    }

    if (useRealTime) {
      push({
        key: "real_time_fit",
        label: "Real-time data",
        answer: "Need real-time/streaming",
        toolValue: tool.streaming_support ? "Supports streaming ingest" : "Batch only",
        weight: weights["real_time_fit"] ?? 0,
        score: tool.streaming_support ? 1 : 0,
        positive: "Handles streaming data, not just batch loads",
        caveat: "Batch-oriented — real-time data would be a stretch",
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
      costEstimate: estimateWarehouseCost(tool, answers["data_volume_scale"] as string | undefined),
    };
  });

  return results.sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
}
