import type { ErpTool } from "@/data/erpTools";
import type { Answers } from "./questions";
import type { Profile } from "./profileStore";
import type { ImplementationPlan } from "./implementationPlan";
import type { ExitRisk } from "./exitRisk";

/* ---------------- Implementation plan ---------------- */

const PHASE_DURATIONS = {
  light: ["1-2 weeks", "1-2 weeks", "2-3 weeks", "1-2 weeks", "1 week"],
  medium: ["2-4 weeks", "3-6 weeks", "4-8 weeks", "2-4 weeks", "2-4 weeks"],
  heavy: ["4-8 weeks", "6-10 weeks", "8-16 weeks", "4-8 weeks", "4-6 weeks"],
} as const;

const ADMIN_FIT: Record<string, Record<ErpTool["ux_complexity"], number>> = {
  "No dedicated admin — it needs to be simple": { simple: 1, moderate: 0.5, steep: 0.1 },
  "Part-time admin or finance lead": { simple: 0.8, moderate: 1, steep: 0.5 },
  "One dedicated systems administrator": { simple: 0.6, moderate: 1, steep: 0.9 },
  "A full IT / systems team": { simple: 0.5, moderate: 0.8, steep: 1 },
};

const COORDINATION: Record<string, number> = { "51-200": 0.04, "201-1000": 0.08, "1000+": 0.12 };

function text(answers: Answers, key: string): string {
  const v = answers[key];
  return typeof v === "string" ? v : "";
}

function band(tool: ErpTool): keyof typeof PHASE_DURATIONS {
  if (tool.implementation_cost_tier === "high") return "heavy";
  if (tool.implementation_cost_tier === "medium") return "medium";
  return "light";
}

export function buildErpImplementationPlan(
  tool: ErpTool,
  answers: Answers,
  profile: Profile | null,
): ImplementationPlan {
  const admin = text(answers, "erp_admin_capacity");
  const size = profile?.company_size || text(answers, "company_size");
  const fit = ADMIN_FIT[admin]?.[tool.ux_complexity] ?? 0.65;
  const effort = { low: 0, medium: 0.12, high: 0.25 }[tool.implementation_cost_tier];
  const time = { days: 0, weeks: 0.08, months: 0.2 }[tool.time_to_value];
  const score = fit - effort - time - (COORDINATION[size] ?? 0);
  const label =
    score >= 0.7 ? "Straightforward" : score >= 0.35 ? "Moderate effort" : "Significant undertaking";
  const rationale =
    tool.ux_complexity === "steep" && admin.startsWith("No dedicated")
      ? `${tool.name} has a steep learning curve for a business without a dedicated ERP owner.`
      : tool.implementation_cost_tier === "high"
        ? `${tool.name} is a ${tool.time_to_value}-long, typically partner-led rollout — plan it as a project with a named owner and budget.`
        : `${tool.name}'s ${tool.ux_complexity} learning curve and ${tool.implementation_cost_tier} implementation effort look manageable for your setup.`;

  const touchpoints = [
    `${tool.connector_tier[0]!.toUpperCase()}${tool.connector_tier.slice(1)} connector coverage${tool.has_rest_api ? " plus a REST API for custom integrations" : ""}.`,
    `Deployment: ${tool.deployment_options.map((d) => d.replace("_", "-")).join(", ")}.`,
    tool.multi_entity === "advanced"
      ? "Advanced multi-entity support for consolidation and intercompany."
      : "Basic multi-entity support — confirm how consolidation would work if you add entities.",
  ];
  const stack = profile?.existing_stack?.trim();
  if (stack) touchpoints.push(`You listed ${stack} — check for a native connector before assuming custom integration work.`);

  const d = PHASE_DURATIONS[band(tool)];
  return {
    feasibility: { label, rationale },
    integration: {
      summary: `${tool.name} sits at the centre of your back office, so finance, inventory, CRM and payroll connections all need mapping.`,
      touchpoints: touchpoints.slice(0, 4),
    },
    actionPlan: [
      {
        phase: "Discovery & process mapping",
        description: `Map how orders, purchasing, inventory and the financial close actually run today, and decide which processes ${tool.name} will own.`,
        duration: d[0],
      },
      {
        phase: "Data clean-up & migration plan",
        description: "Clean and map the chart of accounts, customer/vendor/item masters, opening balances and open orders before anything is loaded.",
        duration: d[1],
      },
      {
        phase: "Configuration & integrations",
        description: `Configure ${tool.customization_level === "ootb" ? "the standard" : tool.customization_level} workflows, approvals and permissions, then connect banking, CRM and other systems.`,
        duration: d[2],
      },
      {
        phase: "Testing & parallel run",
        description: "Run real transactions end to end and, where practical, run a period in parallel with your current system to reconcile results.",
        duration: d[3],
      },
      {
        phase: "Cutover & hypercare",
        description: "Cut over at a period or quarter boundary, then give users close support through the first period-end close.",
        duration: d[4],
      },
    ],
  };
}

/* ---------------- Exit risk ---------------- */

const NOT_A_SYSTEM = [
  "Spreadsheets / manual processes",
  "Nothing yet — this would be our first ERP",
  "Not sure",
];

function labelFromScore(score: number, low: number, high: number): ExitRisk["label"] {
  if (score <= low) return "Low";
  if (score < high) return "Moderate";
  return "High";
}

export function buildErpExitRisk(tool: ErpTool, answers: Answers = {}): ExitRisk {
  let score = 0;
  const factors: string[] = [];
  const factorCodes: string[] = [];
  const add = (points: number, code: string, factor: string) => {
    score += points;
    factors.push(factor);
    factorCodes.push(code);
  };

  if (tool.customization_level === "composable") {
    add(2, "customization_composable", "Deeply composable customization — custom scripts, fields and workflows are usually the most expensive thing to rebuild on another ERP.");
  }
  if (tool.implementation_cost_tier === "high") {
    add(1, "partner_dependency", "Implementation partners are commonly involved — expect to need outside help leaving, the same way you likely needed it to set up.");
  }
  if (tool.connector_tier === "high") {
    add(1, "connector_tier_high", "Deep integration web — an ERP sits at the centre of your back office, so every connected system would need rewiring.");
  }
  if (tool.multi_entity === "advanced") {
    add(1, "multi_entity_advanced", "Advanced multi-entity setup — consolidation and intercompany logic is hard to move to another system.");
  }
  if (tool.deployment_options.length === 1 && tool.deployment_options[0] === "cloud") {
    add(1, "deployment_cloud_only", "Cloud-only — there's no self-hosted fallback, so your data's exit path depends on the vendor's export tools.");
  }
  if (tool.pricing_model === "quote" || tool.tco_tier >= 4) {
    add(1, "long_commitment", "Multi-year terms are typical at this price level — leaving mid-term can mean paying out the contract.");
  }
  if (tool.pricing_model === "consumption") {
    add(0, "consumption_pricing", "Consumption-based pricing — costs track usage, which makes it harder to compare like-for-like when you leave or renew.");
  }
  const current = text(answers, "current_erp_tool");
  if (current && !NOT_A_SYSTEM.includes(current) && current !== tool.name) {
    add(1, "erp_migration_from_current", `You're moving off ${current} — that migration's data mapping is work you'd largely repeat if you ever switch again.`);
  }

  return {
    label: labelFromScore(score, 2, 5),
    score,
    factors,
    factorCodes,
    reassurance: factors.length === 0
      ? "Nothing here points to unusual lock-in — it stays close to out-of-the-box, so there's relatively little to untangle if you leave."
      : null,
  };
}

/* ---------------- Fit profile ---------------- */

const COST: Record<number, string> = {
  1: "Startups and budget-conscious businesses",
  2: "Small businesses with modest software budgets",
  3: "Growing small-to-mid-size companies",
  4: "Established mid-market companies",
  5: "Large organizations with substantial ERP budgets",
};
const UX: Record<ErpTool["ux_complexity"], string> = {
  simple: "Businesses without a dedicated ERP administrator",
  moderate: "Companies with a part-time admin or finance systems lead",
  steep: "Organizations with a dedicated IT or systems team",
};
const INDUSTRY: Record<string, string> = {
  finance: "finance & accounting",
  distribution: "distribution & inventory",
  manufacturing: "manufacturing",
  services: "services & projects",
};

export function buildErpFitProfile(tool: ErpTool): string[] {
  const bullets = [
    COST[tool.tco_tier] ?? "Businesses with a flexible ERP budget",
    UX[tool.ux_complexity],
    `Strongest for: ${tool.industry_strength.map((i) => INDUSTRY[i] ?? i).join(", ")}`,
    `Typically a fit for ${tool.sweet_spot_sizes.join(", ")}-employee companies`,
  ];
  if (tool.multi_entity === "advanced") bullets.push("Groups running multiple entities or currencies that need consolidation");
  if (tool.manufacturing_depth === "advanced") bullets.push("Manufacturers needing BOMs, production planning and shop-floor control");
  if (tool.security_certs.length >= 2)
    bullets.push(`Good fit for regulated industries needing strong compliance credentials (${tool.security_certs.join(", ")})`);
  return bullets.slice(0, 6);
}
