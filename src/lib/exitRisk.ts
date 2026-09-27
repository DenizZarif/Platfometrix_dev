import type { BiTool } from "@/data/biTools";
import type { CrmTool } from "@/data/crmTools";
import type { WarehouseTool } from "@/data/warehouseTools";

export interface ExitRisk {
  label: "Low" | "Moderate" | "High";
  score: number;
  factors: string[];
  reassurance: string | null;
}

function labelFromScore(score: number, low: number, high: number): "Low" | "Moderate" | "High" {
  if (score <= low) return "Low";
  if (score < high) return "Moderate";
  return "High";
}

const hasPartnerDependency = (hiddenCosts: string[]) =>
  hiddenCosts.some((h) => /partner/i.test(h));

const mentionsMigration = (hiddenCosts: string[]) =>
  hiddenCosts.some((h) => /migrat/i.test(h));

const CUSTOMIZATION_SCORE: Record<string, number> = { ootb: 0, configurable: 1, composable: 2 };

const CUSTOMIZATION_FACTOR: Record<string, string> = {
  composable:
    "Deeply composable customization — heavily configured logic, fields or workflows are usually the most expensive thing to rebuild on another platform.",
  configurable:
    "Moderate customization — some configured setup would need to be recreated elsewhere.",
};

const REASSURANCE =
  "Nothing here points to unusual lock-in — it stays close to out-of-the-box, so there's relatively little to untangle if you leave.";

export function buildBiExitRisk(tool: BiTool): ExitRisk {
  let score = CUSTOMIZATION_SCORE[tool.customization_level] ?? 0;
  const factors: string[] = [];

  if (tool.customization_level !== "ootb") {
    factors.push(CUSTOMIZATION_FACTOR[tool.customization_level]!);
  }

  if (tool.report_builder !== "sql") {
    score += 1;
    factors.push(
      `${tool.report_builder === "dragdrop" ? "Drag-and-drop" : "GUI-based"} report building — dashboards built this way typically don't export cleanly to another tool's format.`,
    );
  }

  if (tool.connector_tier === "high") {
    score += 1;
    factors.push(
      "Wide connector footprint — the more data sources and systems you've wired to it, the more integrations there are to rewire on the way out.",
    );
  }

  if (tool.embed_capability) {
    score += 1;
    factors.push(
      "Supports embedding — if you've embedded it in your own product, customers or internal tools may depend on it directly, not just your team.",
    );
  }

  if (hasPartnerDependency(tool.hidden_costs)) {
    score += 1;
    factors.push(
      "Implementation partners are commonly involved — expect to need outside help leaving, the same way you likely needed it to set up.",
    );
  }

  return {
    label: labelFromScore(score, 1, 5),
    score,
    factors,
    reassurance: factors.length === 0 ? REASSURANCE : null,
  };
}

export function buildCrmExitRisk(tool: CrmTool): ExitRisk {
  let score = CUSTOMIZATION_SCORE[tool.customization_level] ?? 0;
  const factors: string[] = [];

  if (tool.customization_level !== "ootb") {
    factors.push(CUSTOMIZATION_FACTOR[tool.customization_level]!);
  }

  if (tool.marketing_automation_tier === "advanced") {
    score += 1;
    factors.push(
      "Advanced marketing automation — sequences, scoring rules and workflows built here rarely transfer, they get rebuilt from scratch elsewhere.",
    );
  }

  if (tool.connector_tier === "high") {
    score += 1;
    factors.push(
      "Wide connector footprint — the more of your other tools you've wired to it, the more integrations there are to rewire on the way out.",
    );
  }

  if (hasPartnerDependency(tool.hidden_costs)) {
    score += 1;
    factors.push(
      "Implementation partners are commonly involved — expect to need outside help leaving, the same way you likely needed it to set up.",
    );
  }

  return {
    label: labelFromScore(score, 1, 4),
    score,
    factors,
    reassurance: factors.length === 0 ? REASSURANCE : null,
  };
}

export function buildWarehouseExitRisk(tool: WarehouseTool): ExitRisk {
  let score = CUSTOMIZATION_SCORE[tool.customization_level] ?? 0;
  const factors: string[] = [];

  if (tool.customization_level !== "ootb") {
    factors.push(CUSTOMIZATION_FACTOR[tool.customization_level]!);
  }

  if (tool.deployment_model === "cloud") {
    score += 2;
    factors.push(
      "Fully managed, proprietary compute — your data typically needs to be exported and reloaded elsewhere, unlike a self-hosted engine you control directly.",
    );
  } else if (tool.deployment_model === "hybrid") {
    score += 1;
    factors.push(
      "Hybrid deployment — some pieces run in a managed service, which still means some export and reload work on the way out.",
    );
  }

  if (tool.cloud_providers.length <= 1) {
    score += 1;
    factors.push(
      `Tied to a single cloud provider (${tool.cloud_providers[0] ?? "one provider"}) — leaving may mean a cloud migration too, not just a warehouse swap.`,
    );
  }

  if (tool.native_ingestion_tier === "high") {
    score += 1;
    factors.push(
      "Deep native ingestion — pipelines built directly in-platform need to be rebuilt, not just repointed, if you migrate.",
    );
  }

  if (mentionsMigration(tool.hidden_costs)) {
    score += 1;
    factors.push("Vendor materials themselves flag migration off this platform as a notable cost.");
  }

  return {
    label: labelFromScore(score, 1, 5),
    score,
    factors,
    reassurance: factors.length === 0 ? REASSURANCE : null,
  };
}
