import type { BiTool } from "@/data/biTools";
import type { CrmTool } from "@/data/crmTools";
import type { WarehouseTool } from "@/data/warehouseTools";

const BI_COST: Record<number, string> = {
  1: "Startups and budget-conscious teams",
  2: "Small-to-mid-size companies with modest BI budgets",
  3: "Growing mid-market companies",
  4: "Established mid-market to enterprise organizations",
  5: "Large enterprises with substantial BI budgets",
};

const BI_UX: Record<BiTool["ux_complexity"], string> = {
  simple: "Teams without a dedicated data/analyst function",
  moderate: "Teams with at least a part-time analyst",
  steep: "Organizations with a dedicated data team or data engineers",
};

const BI_BREADTH: Record<BiTool["data_source_breadth"], string> = {
  broad: "Companies pulling data from many different systems",
  medium: "Companies with a moderate mix of data sources",
  narrow: "Companies with a simple, consolidated data stack",
};

const BI_CUSTOMIZATION: Record<BiTool["customization_level"], string> = {
  ootb: "Teams that want it to work well out of the box",
  configurable: "Teams that want to configure it to fit their process",
  composable: "Organizations that want to build extensively on top of the platform",
};

const CRM_COST: Record<number, string> = {
  1: "Startups and very small teams",
  2: "Small businesses",
  3: "Growing small-to-mid-size sales teams",
  4: "Mid-market to enterprise sales organizations",
  5: "Large enterprise sales organizations",
};

const CRM_UX: Record<CrmTool["ux_complexity"], string> = {
  simple: "Small teams wanting something easy to adopt with minimal setup",
  moderate: "Teams comfortable with a moderate learning curve",
  steep: "Organizations with dedicated CRM administrators/ops",
};

const CRM_MARKETING: Record<CrmTool["marketing_automation_tier"], string> = {
  advanced: "Companies running sophisticated marketing automation alongside sales",
  basic: "Teams wanting light marketing automation",
  none: "Sales-only teams that don't need built-in marketing automation",
};

const CRM_MOBILE: Record<CrmTool["mobile_app_quality"], string> = {
  full: "Field or mobile-first sales teams",
  basic: "Teams that mostly work from a desk",
};

const CRM_REPORTING: Record<CrmTool["reporting_depth"], string> = {
  advanced: "Sales orgs needing deep pipeline reporting and forecasting",
  basic: "Teams needing straightforward, simple reporting",
};

const WAREHOUSE_SCALE: Record<WarehouseTool["scale_tier"], string> = {
  small: "Small teams with modest data volumes",
  medium: "Mid-size data teams",
  large: "Large-scale data operations",
  very_large: "Enterprises with very large-scale data workloads",
};

const WAREHOUSE_WORKLOAD: Record<string, string> = {
  bi_reporting: "BI & reporting workloads",
  data_science_ml: "data science / ML workloads",
  adhoc_exploration: "ad-hoc data exploration",
  real_time_streaming: "real-time / streaming analytics",
};

const WAREHOUSE_DEPLOYMENT: Record<WarehouseTool["deployment_model"], string> = {
  cloud: "Cloud-native teams happy to fully outsource infrastructure",
  hybrid: "Organizations wanting flexibility between cloud and on-prem/hybrid control",
  self_hosted: "Organizations wanting full control over their own infrastructure",
};

function complianceBullet(certs: string[]): string {
  return `Good fit for regulated industries needing strong compliance credentials (${certs.join(", ")})`;
}

export function buildBiFitProfile(tool: BiTool): string[] {
  const bullets = [
    BI_COST[tool.tco_tier] ?? "Teams with a flexible BI budget",
    BI_UX[tool.ux_complexity],
    BI_BREADTH[tool.data_source_breadth],
    BI_CUSTOMIZATION[tool.customization_level],
  ];
  if (tool.security_certs.length >= 2) bullets.push(complianceBullet(tool.security_certs));
  if (tool.embed_capability) bullets.push("Works well for companies embedding analytics into their own product");
  return bullets.slice(0, 6);
}

export function buildCrmFitProfile(tool: CrmTool): string[] {
  const bullets = [
    CRM_COST[tool.tco_tier] ?? "Sales teams with a flexible software budget",
    CRM_UX[tool.ux_complexity],
    CRM_MARKETING[tool.marketing_automation_tier],
    CRM_MOBILE[tool.mobile_app_quality],
    CRM_REPORTING[tool.reporting_depth],
  ];
  if (tool.security_certs.length >= 2) bullets.push(complianceBullet(tool.security_certs));
  return bullets.slice(0, 6);
}

export function buildWarehouseFitProfile(tool: WarehouseTool): string[] {
  const workloads = tool.workload_strengths
    .map((strength) => WAREHOUSE_WORKLOAD[strength])
    .filter((label): label is string => Boolean(label));
  const bullets = [
    WAREHOUSE_SCALE[tool.scale_tier],
    `Strongest for: ${workloads.join(", ")}`,
    WAREHOUSE_DEPLOYMENT[tool.deployment_model],
  ];
  if (tool.streaming_support) bullets.push("Good fit for teams needing real-time/streaming ingestion");
  if (tool.security_certs.length >= 2) bullets.push(complianceBullet(tool.security_certs));
  return bullets.slice(0, 6);
}