import { BI_TOOLS, type BiTool } from "@/data/biTools";
import { CRM_TOOLS, type CrmTool } from "@/data/crmTools";
import { WAREHOUSE_TOOLS, type WarehouseTool } from "@/data/warehouseTools";
import { estimateBiCost, estimateCrmCost, estimateWarehouseCost } from "@/lib/costEstimate";
import type { Answers } from "@/lib/questions";
import type { Profile } from "@/lib/profileStore";

export interface MigrationEstimate {
  applicable: boolean;
  currentToolLabel: string | null;
  effort: { label: "Low" | "Moderate" | "High"; rationale: string };
  whatMoves: string[];
  costNote: string;
}

const NOT_APPLICABLE: MigrationEstimate = {
  applicable: false,
  currentToolLabel: null,
  effort: { label: "Low", rationale: "" },
  whatMoves: [],
  costNote: "",
};

const EFFORT_FROM_TIER: Record<string, "Low" | "Moderate" | "High"> = {
  low: "Low",
  medium: "Moderate",
  high: "High",
};

const BASE_SCORE: Record<string, number> = { low: 0, medium: 1, high: 2 };

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function scoreToLabel(score: number): "Low" | "Moderate" | "High" {
  if (score <= 0) return "Low";
  if (score <= 2) return "Moderate";
  return "High";
}

function companySizeOf(answers: Answers, profile: Profile | null): string | undefined {
  const fromProfile = profile?.company_size ?? undefined;
  const fromAnswers = answers["company_size"];
  return (fromProfile ?? (typeof fromAnswers === "string" ? fromAnswers : undefined)) || undefined;
}

function isLargeOrg(size: string | undefined): boolean {
  return size === "201-1000" || size === "1000+";
}

function rationaleFor(label: string, drivers: string[], candidateName: string): string {
  if (!drivers.length) {
    return `${label} effort — ${candidateName} sets up cleanly and nothing major about your current setup complicates the move.`;
  }
  return `${label} effort — mainly driven by ${drivers.join(", ")}.`;
}

const CONNECTOR_PHRASE: Record<string, string> = {
  high: "a wide connector library, so most of your existing sources should reconnect quickly",
  medium: "a reasonable connector library, though some sources may need manual setup",
  low: "a limited connector library, so expect some custom integration work",
};

const INGESTION_PHRASE: Record<string, string> = {
  high: "strong native ingestion, so most pipelines can be rebuilt in-platform",
  medium: "moderate native ingestion, so some pipelines may need an external ELT tool",
  low: "limited native ingestion, so plan to keep or add a separate ELT tool",
};

const BUILDER_LABEL: Record<string, string> = {
  dragdrop: "drag-and-drop",
  hybrid: "mixed drag-and-drop and SQL",
  sql: "SQL-first",
};

const DEPLOYMENT_LABEL: Record<string, string> = {
  cloud: "fully managed cloud",
  hybrid: "hybrid",
  self_hosted: "self-hosted",
};

function genericEstimate(
  currentAnswer: string,
  candidateName: string,
  implementationTier: string,
  secondBullet: string,
): MigrationEstimate {
  const label = EFFORT_FROM_TIER[implementationTier] ?? "Moderate";
  return {
    applicable: true,
    currentToolLabel: currentAnswer,
    effort: {
      label,
      rationale: `We don't have specifics on what you run today, so this reflects ${candidateName}'s own setup effort alone.`,
    },
    whatMoves: [`Rebuild your current reporting and processes in ${candidateName}`, secondBullet],
    costNote: `We don't have cost data for what you use today — compare your current spend manually against the estimate above.`,
  };
}

/* ---------------- BI ---------------- */

export function buildBiMigrationEstimate(
  currentAnswer: string | undefined,
  candidateTool: BiTool,
  answers: Answers,
  profile: Profile | null,
): MigrationEstimate {
  if (
    !currentAnswer ||
    currentAnswer === "Nothing yet — this would be our first BI tool" ||
    currentAnswer === "Not sure"
  ) {
    return NOT_APPLICABLE;
  }

  const currentTool = BI_TOOLS.find((t) => t.name === currentAnswer);
  if (!currentTool) {
    return genericEstimate(
      currentAnswer,
      candidateTool.name,
      candidateTool.implementation_cost_tier,
      `Connect your data sources — ${candidateTool.name} has ${CONNECTOR_PHRASE[candidateTool.connector_tier]}`,
    );
  }

  let score = BASE_SCORE[candidateTool.implementation_cost_tier] ?? 1;
  const drivers: string[] = [];
  const bullets: string[] = [`Rebuild dashboards and reports currently in ${currentTool.name}`];

  if (currentTool.report_builder !== candidateTool.report_builder) {
    score += 1;
    drivers.push("a different report-building style");
    bullets.push(
      `Reports move from a ${BUILDER_LABEL[currentTool.report_builder]} to a ${BUILDER_LABEL[candidateTool.report_builder]} building style`,
    );
  }
  if (currentTool.embed_capability && !candidateTool.embed_capability) {
    score += 1;
    drivers.push("losing embedded analytics");
    bullets.push(
      `Heads up: ${candidateTool.name} doesn't support embedding, which ${currentTool.name} does`,
    );
  }
  bullets.push(
    `Reconnect your data sources — ${candidateTool.name} has ${CONNECTOR_PHRASE[candidateTool.connector_tier]}`,
  );

  const size = companySizeOf(answers, profile);
  if (isLargeOrg(size)) {
    score += 1;
    drivers.push("coordination across a large organization");
  }

  const label = scoreToLabel(score);
  const currentCost = estimateBiCost(currentTool, size);
  const candidateCost = estimateBiCost(candidateTool, size);

  return {
    applicable: true,
    currentToolLabel: currentTool.name,
    effort: { label, rationale: rationaleFor(label, drivers, candidateTool.name) },
    whatMoves: bullets.slice(0, 5),
    costNote: costSentence(currentTool.name, currentCost, candidateTool.name, candidateCost),
  };
}

function costSentence(
  currentName: string,
  currentCost: { monthlyLow: number; monthlyHigh: number },
  candidateName: string,
  candidateCost: { monthlyLow: number; monthlyHigh: number },
): string {
  if (currentCost.monthlyLow === 0 && currentCost.monthlyHigh === 0) {
    return `${candidateName} is estimated at ${money(candidateCost.monthlyLow)}–${money(candidateCost.monthlyHigh)}/mo; budget for a short overlap period running both in parallel during cutover.`;
  }
  return `Today's estimated cost (${currentName}): ${money(currentCost.monthlyLow)}–${money(currentCost.monthlyHigh)}/mo → ${candidateName}: ${money(candidateCost.monthlyLow)}–${money(candidateCost.monthlyHigh)}/mo. Budget for a short overlap period running both in parallel during cutover.`;
}

/* ---------------- CRM ---------------- */

export function buildCrmMigrationEstimate(
  currentAnswer: string | undefined,
  candidateTool: CrmTool,
  answers: Answers,
  profile: Profile | null,
): MigrationEstimate {
  if (
    !currentAnswer ||
    currentAnswer === "Nothing yet — this would be our first CRM" ||
    currentAnswer === "Not sure"
  ) {
    return NOT_APPLICABLE;
  }

  const currentTool = CRM_TOOLS.find((t) => t.name === currentAnswer);
  if (!currentTool) {
    return genericEstimate(
      currentAnswer,
      candidateTool.name,
      candidateTool.implementation_cost_tier,
      `Import your contacts, companies and pipeline — ${candidateTool.name} has ${CONNECTOR_PHRASE[candidateTool.connector_tier]}`,
    );
  }

  let score = BASE_SCORE[candidateTool.implementation_cost_tier] ?? 1;
  const drivers: string[] = [];
  const bullets: string[] = [
    `Migrate contacts, companies, and pipeline history into ${candidateTool.name}`,
  ];

  if (currentTool.customization_level === "composable") {
    score += 1;
    drivers.push("a heavily customized current setup");
    bullets.push(
      "Your current setup is highly customized — plan extra time to rebuild custom fields and workflows",
    );
  }
  if (
    currentTool.marketing_automation_tier === "advanced" &&
    candidateTool.marketing_automation_tier !== "advanced"
  ) {
    score += 1;
    drivers.push("weaker marketing automation");
    bullets.push(
      `Heads up: marketing automation drops from advanced in ${currentTool.name} to ${candidateTool.marketing_automation_tier} in ${candidateTool.name}`,
    );
  }
  if (currentTool.mobile_app_quality === "full" && candidateTool.mobile_app_quality === "basic") {
    score += 1;
    drivers.push("a weaker mobile app");
    bullets.push(
      `Heads up: ${candidateTool.name}'s mobile app is more basic than what ${currentTool.name} offers`,
    );
  }
  bullets.push(
    `Reconnect your other tools — ${candidateTool.name} has ${CONNECTOR_PHRASE[candidateTool.connector_tier]}`,
  );

  const size = companySizeOf(answers, profile);
  if (isLargeOrg(size)) {
    score += 1;
    drivers.push("coordination across a large organization");
  }

  const label = scoreToLabel(score);
  return {
    applicable: true,
    currentToolLabel: currentTool.name,
    effort: { label, rationale: rationaleFor(label, drivers, candidateTool.name) },
    whatMoves: bullets.slice(0, 5),
    costNote: costSentence(
      currentTool.name,
      estimateCrmCost(currentTool, size),
      candidateTool.name,
      estimateCrmCost(candidateTool, size),
    ),
  };
}

/* ---------------- Warehouse ---------------- */

export function buildWarehouseMigrationEstimate(
  currentAnswer: string | undefined,
  candidateTool: WarehouseTool,
  answers: Answers,
  profile: Profile | null,
): MigrationEstimate {
  if (
    !currentAnswer ||
    currentAnswer === "No formal warehouse yet" ||
    currentAnswer === "Not sure"
  ) {
    return NOT_APPLICABLE;
  }

  const currentTool = WAREHOUSE_TOOLS.find((t) => t.name === currentAnswer);
  if (!currentTool) {
    return genericEstimate(
      currentAnswer,
      candidateTool.name,
      candidateTool.implementation_cost_tier,
      `Rebuild your ingestion pipelines — ${candidateTool.name} has ${INGESTION_PHRASE[candidateTool.native_ingestion_tier]}`,
    );
  }

  let score = BASE_SCORE[candidateTool.implementation_cost_tier] ?? 1;
  const drivers: string[] = [];
  const bullets: string[] = [
    `Migrate your data models and pipelines from ${currentTool.name} into ${candidateTool.name}`,
  ];

  if (currentTool.deployment_model !== candidateTool.deployment_model) {
    score += 1;
    drivers.push("a change of deployment model");
    bullets.push(
      `Deployment model changes from ${DEPLOYMENT_LABEL[currentTool.deployment_model]} to ${DEPLOYMENT_LABEL[candidateTool.deployment_model]} — expect re-platforming work`,
    );
  }
  const sharedCloud = currentTool.cloud_providers.some((p) =>
    candidateTool.cloud_providers.includes(p),
  );
  if (!sharedCloud) {
    score += 1;
    drivers.push("no shared cloud provider");
    bullets.push(
      "No shared cloud provider with your current setup — plan for data egress and network changes",
    );
  }
  if (currentTool.scale_tier === "large" || currentTool.scale_tier === "very_large") {
    score += 1;
    drivers.push("the volume of data already in place");
  }
  bullets.push(
    `Rebuild ingestion — ${candidateTool.name} has ${INGESTION_PHRASE[candidateTool.native_ingestion_tier]}`,
  );

  const size = companySizeOf(answers, profile);
  if (isLargeOrg(size)) {
    score += 1;
    drivers.push("coordination across a large organization");
  }

  const rawScale = answers["data_volume_scale"];
  const scale = typeof rawScale === "string" ? rawScale : undefined;
  const label = scoreToLabel(score);

  return {
    applicable: true,
    currentToolLabel: currentTool.name,
    effort: { label, rationale: rationaleFor(label, drivers, candidateTool.name) },
    whatMoves: bullets.slice(0, 5),
    costNote: costSentence(
      currentTool.name,
      estimateWarehouseCost(currentTool, scale),
      candidateTool.name,
      estimateWarehouseCost(candidateTool, scale),
    ),
  };
}
