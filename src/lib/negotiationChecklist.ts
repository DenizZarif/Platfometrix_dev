import type { ExitRisk } from "@/lib/exitRisk";

export const NEGOTIATION_ASKS: Record<string, string> = {
  customization_configurable:
    "Get a written export of your configured fields, workflows or setup — confirm it's included, not a paid professional-services add-on.",
  customization_composable:
    "Get a written export of your custom fields, logic and workflows before signing — confirm it's included, not a paid professional-services engagement.",
  report_builder_gui:
    "Ask whether dashboards can be exported in an open or portable format, not just as static images or PDFs.",
  connector_tier_high:
    "Get a written list of every connector or integration you'll actually use, and confirm none require a higher (paid) tier to keep working.",
  embed_capability:
    "If you plan to embed this in your own product, get an explicit off-boarding timeline for what happens to those embeds if you ever migrate.",
  partner_dependency:
    "Ask upfront what a partner-led implementation costs, and whether outside help is available to leave later too — don't assume it works both ways.",
  marketing_automation_advanced:
    "Ask whether marketing sequences and scoring rules can be exported in a reusable format, or would be rebuilt from scratch on any platform switch.",
  deployment_cloud:
    "Get the data-export process and format documented in writing before you load a single production table.",
  deployment_hybrid:
    "Get the data-export process for the managed portion documented in writing before you rely on it.",
  single_cloud_provider:
    "Confirm whether switching cloud providers later requires a full data re-migration, and get a rough cost estimate for that in writing now, while you have leverage.",
  native_ingestion_high:
    "Ask whether ingestion pipelines can be exported or ported, or if they're vendor-specific configuration you'd have to rebuild elsewhere.",
  migration_mentioned:
    "The vendor's own materials flag migration cost — ask them directly what that looks like in practice, before you sign, not after.",
};

export const UNIVERSAL_NEGOTIATION_TIP =
  "Whatever else applies, get the contract's termination and auto-renewal terms confirmed in writing — verbal assurances from a salesperson don't survive procurement.";

export function buildNegotiationChecklist(exitRisk: ExitRisk): string[] {
  const items: string[] = [];
  for (const code of exitRisk.factorCodes) {
    const ask = NEGOTIATION_ASKS[code];
    if (ask && !items.includes(ask)) items.push(ask);
  }
  items.push(UNIVERSAL_NEGOTIATION_TIP);
  return items;
}
