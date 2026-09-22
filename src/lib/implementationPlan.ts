import type { BiTool } from "@/data/biTools";
import type { CrmTool } from "@/data/crmTools";
import type { WarehouseTool } from "@/data/warehouseTools";
import type { Answers } from "./questions";
import type { Profile } from "./profileStore";

export interface ImplementationPlan {
  feasibility: {
    label: "Straightforward" | "Moderate effort" | "Significant undertaking";
    rationale: string;
  };
  integration: { summary: string; touchpoints: string[] };
  actionPlan: { phase: string; description: string; duration: string }[];
}

type ImplementationTool = Pick<
  BiTool,
  "name" | "ux_complexity" | "implementation_cost_tier" | "time_to_value"
>;

const UX_FIT: Record<string, Record<ImplementationTool["ux_complexity"], number>> = {
  "No dedicated data person": { simple: 1, moderate: 0.5, steep: 0.1 },
  "Part-time / shared analyst": { simple: 0.8, moderate: 1, steep: 0.5 },
  "One dedicated analyst": { simple: 0.6, moderate: 1, steep: 0.9 },
  "Full data team": { simple: 0.5, moderate: 0.8, steep: 1 },
};

const COMPANY_COORDINATION: Record<string, number> = {
  "1-10": 0,
  "11-50": 0,
  "51-200": 0.04,
  "201-1000": 0.08,
  "1000+": 0.12,
};

const PHASE_DURATIONS = {
  light: ["1-2 days", "2-4 days", "1-2 days", "3-5 days"],
  medium: ["2-4 days", "1-2 weeks", "1 week", "1-2 weeks"],
  heavy: ["1-2 weeks", "2-4 weeks", "3-6 weeks", "2-4 weeks"],
} as const;

function answerText(answers: Answers, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value : "";
}

function implementationBand(tool: ImplementationTool): keyof typeof PHASE_DURATIONS {
  if (tool.time_to_value === "months" || tool.implementation_cost_tier === "high") return "heavy";
  if (tool.time_to_value === "weeks" || tool.implementation_cost_tier === "medium") return "medium";
  return "light";
}

function feasibilityFor(
  tool: ImplementationTool,
  answers: Answers,
  profile: Profile | null,
): ImplementationPlan["feasibility"] {
  const maturity = answerText(answers, "technical_maturity") || profile?.technical_maturity || "";
  const companySize = profile?.company_size || answerText(answers, "company_size");
  const uxFit = UX_FIT[maturity]?.[tool.ux_complexity] ?? 0.65;
  const effortPenalty = { low: 0, medium: 0.12, high: 0.25 }[tool.implementation_cost_tier];
  const timePenalty = { days: 0, weeks: 0.08, months: 0.2 }[tool.time_to_value];
  const score = uxFit - effortPenalty - timePenalty - (COMPANY_COORDINATION[companySize] ?? 0);
  const label =
    score >= 0.7 ? "Straightforward" : score >= 0.35 ? "Moderate effort" : "Significant undertaking";

  if (tool.ux_complexity === "steep" && maturity === "No dedicated data person") {
    return { label, rationale: `${tool.name} has a steep learning curve for a team without a dedicated specialist.` };
  }
  if (tool.ux_complexity === "steep" && maturity === "Part-time / shared analyst") {
    return { label, rationale: `${tool.name}'s steep learning curve is likely to stretch a part-time or shared analyst.` };
  }
  if (tool.implementation_cost_tier === "high" || tool.time_to_value === "months") {
    return {
      label,
      rationale: `${tool.name} fits a capable team, but its ${tool.implementation_cost_tier} setup effort and ${tool.time_to_value}-long path to value require a planned rollout.`,
    };
  }
  if (companySize === "1000+" || companySize === "201-1000") {
    return {
      label,
      rationale: `${tool.name}'s ${tool.ux_complexity} workflow is manageable, with extra coordination needed across a ${companySize}-person company.`,
    };
  }
  if (uxFit >= 0.8) {
    return {
      label,
      rationale: `${tool.name}'s ${tool.ux_complexity} workflow matches your team's day-to-day capability well.`,
    };
  }
  if (!maturity) {
    return {
      label,
      rationale: `${tool.name} has a ${tool.ux_complexity} learning curve and ${tool.implementation_cost_tier} implementation effort; confirm who will own the rollout.`,
    };
  }
  return {
    label,
    rationale: `${tool.name}'s ${tool.ux_complexity} workflow will need some support for your current team setup.`,
  };
}

function profileTouchpoint(profile: Profile | null): string | null {
  const stack = profile?.existing_stack?.trim();
  if (stack) return `You listed ${stack} — check for a native connector before assuming custom integration work.`;
  const assets = profile?.digital_assets?.trim();
  if (assets) return `You listed ${assets} — confirm how these assets will connect before planning migration work.`;
  return null;
}

function withProfileTouchpoint(touchpoints: string[], profile: Profile | null): string[] {
  const contextual = profileTouchpoint(profile);
  return contextual ? [...touchpoints.slice(0, 3), contextual] : touchpoints.slice(0, 4);
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildBiImplementationPlan(
  tool: BiTool,
  answers: Answers,
  profile: Profile | null,
): ImplementationPlan {
  const durations = PHASE_DURATIONS[implementationBand(tool)];
  const touchpoints = withProfileTouchpoint(
    [
      `${titleCase(tool.connector_tier)} connector coverage with ${tool.data_source_breadth} data-source breadth.`,
      tool.has_rest_api
        ? "REST API available for custom workflows."
        : "No REST API listed, so custom workflows may need a packaged connector.",
      tool.embed_capability
        ? "Dashboards can be embedded into your product or portal."
        : "Designed primarily for use inside the BI workspace rather than embedded experiences.",
    ],
    profile,
  );

  return {
    feasibility: feasibilityFor(tool, answers, profile),
    integration: {
      summary: `${tool.name} connects through its ${tool.connector_tier} connector tier and ${tool.has_rest_api ? "an available API" : "packaged integrations"}.`,
      touchpoints,
    },
    actionPlan: [
      {
        phase: "Connect your data sources",
        description: `Prioritize the ${tool.data_source_breadth} source coverage and validate the highest-volume connection first.`,
        duration: durations[0],
      },
      {
        phase: "Build initial reports",
        description: `Create a small set of ${tool.report_builder === "sql" ? "SQL-modelled" : tool.report_builder === "hybrid" ? "visual and SQL-backed" : "drag-and-drop"} reports around one high-value workflow.`,
        duration: durations[1],
      },
      {
        phase: "Set up access & governance",
        description: tool.row_level_security
          ? `Configure row-level access and validate the relevant ${tool.security_certs.length ? tool.security_certs.join(", ") : "security"} controls.`
          : "Define workspace roles and confirm that the available access controls meet your sharing requirements.",
        duration: durations[2],
      },
      {
        phase: "Roll out & train the team",
        description: `Pilot ${tool.name} with a small user group, document the ${tool.ux_complexity} workflow, then widen access.`,
        duration: durations[3],
      },
    ],
  };
}

export function buildCrmImplementationPlan(
  tool: CrmTool,
  answers: Answers,
  profile: Profile | null,
): ImplementationPlan {
  const durations = PHASE_DURATIONS[implementationBand(tool)];
  const touchpoints = withProfileTouchpoint(
    [
      `${titleCase(tool.connector_tier)} connector coverage${tool.has_rest_api ? " plus a REST API for custom workflows" : " for packaged integrations"}.`,
      tool.email_calling_builtin
        ? "Built-in email sync and calling keep sales activity in the CRM."
        : "Email and calling require separate tools or integrations.",
      `${titleCase(tool.marketing_automation_tier)} marketing automation with a ${tool.mobile_app_quality} mobile experience.`,
    ],
    profile,
  );

  return {
    feasibility: feasibilityFor(tool, answers, profile),
    integration: {
      summary: `${tool.name} supports a ${tool.connector_tier}-coverage sales stack with ${tool.email_calling_builtin ? "communications built in" : "communications connected separately"}.`,
      touchpoints,
    },
    actionPlan: [
      {
        phase: "Migrate contacts & pipeline",
        description: `Clean and import contacts, companies, deals, owners, and current pipeline stages into ${tool.name}.`,
        duration: durations[0],
      },
      {
        phase: "Configure the sales workflow",
        description: `Set up fields, stages, permissions, and ${tool.customization_level === "ootb" ? "the standard process" : `${tool.customization_level} workflows`} before importing the full history.`,
        duration: durations[1],
      },
      {
        phase: tool.email_calling_builtin ? "Connect email, calling & automation" : "Connect communications & automation",
        description: `${tool.email_calling_builtin ? "Enable the built-in email and calling tools" : "Connect your separate email and calling tools"}${tool.marketing_automation_tier !== "none" ? `, then configure ${tool.marketing_automation_tier} marketing automation` : "; keep marketing in its existing system"}.`,
        duration: durations[2],
      },
      {
        phase: "Train the team & go live",
        description: `Pilot the ${tool.ux_complexity} interface with sales leads, verify mobile access, then move the full team over.`,
        duration: durations[3],
      },
    ],
  };
}

export function buildWarehouseImplementationPlan(
  tool: WarehouseTool,
  answers: Answers,
  profile: Profile | null,
): ImplementationPlan {
  const durations = PHASE_DURATIONS[implementationBand(tool)];
  const providers = tool.cloud_providers.map((provider) => provider.toUpperCase()).join(", ");
  const deployment = tool.deployment_model.replaceAll("_", "-");
  const touchpoints = withProfileTouchpoint(
    [
      `${titleCase(deployment)} deployment across ${providers || "the supported infrastructure"}.`,
      `${titleCase(tool.native_ingestion_tier)} native ingestion capability for loading data.`,
      tool.streaming_support
        ? "Streaming ingestion is supported for real-time workloads."
        : "Batch ingestion is the primary path; real-time workloads need additional tooling.",
    ],
    profile,
  );

  return {
    feasibility: feasibilityFor(tool, answers, profile),
    integration: {
      summary: `${tool.name} uses a ${deployment} deployment model with ${tool.native_ingestion_tier} native ingestion.`,
      touchpoints,
    },
    actionPlan: [
      {
        phase: "Provision & connect your cloud",
        description: `Provision the ${deployment} environment on ${providers || "supported infrastructure"}, then establish network and identity access.`,
        duration: durations[0],
      },
      {
        phase: "Set up ingestion pipelines",
        description: `${tool.native_ingestion_tier === "high" ? "Use the strong native ingestion layer" : tool.native_ingestion_tier === "medium" ? "Use native ingestion for core sources and an ELT tool for gaps" : "Plan a separate ELT layer around the limited native ingestion"}${tool.streaming_support ? ", including the required streaming feeds." : " for scheduled batch loads."}`,
        duration: durations[1],
      },
      {
        phase: "Model & migrate your data",
        description: `Move one representative workload first, then tune its model for ${tool.scale_tier.replaceAll("_", "-")} scale and ${tool.workload_strengths.map((value) => value.replaceAll("_", " ")).join(", ")}.`,
        duration: durations[2],
      },
      {
        phase: "Enable analytics access",
        description: `Connect BI and analyst tools through ${tool.has_rest_api ? "the REST API and supported drivers" : "supported drivers"}, validate permissions, and widen access.`,
        duration: durations[3],
      },
    ],
  };
}