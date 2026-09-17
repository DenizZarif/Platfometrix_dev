export type ReportBuilder = "dragdrop" | "hybrid" | "sql";
export type Tier = "high" | "medium" | "low";
export type Breadth = "broad" | "medium" | "narrow";
export type Ux = "simple" | "moderate" | "steep";
export type Customization = "ootb" | "configurable" | "composable";

export interface BiTool {
  id: string;
  name: string;
  pricing_model: string;
  tco_tier: number;
  security_certs: string[];
  has_rest_api: boolean;
  connector_tier: Tier;
  report_builder: ReportBuilder;
  data_source_breadth: Breadth;
  row_level_security: boolean;
  ux_complexity: Ux;
  customization_level: Customization;
  embed_capability: boolean;
  free_tier: boolean;
}

export const BI_TOOLS: BiTool[] = [
  { id: "tableau", name: "Tableau", pricing_model: "per-seat", tco_tier: 4, security_certs: ["SOC2", "ISO27001"], has_rest_api: true, connector_tier: "high", report_builder: "dragdrop", data_source_breadth: "broad", row_level_security: true, ux_complexity: "steep", customization_level: "composable", embed_capability: true, free_tier: false },
  { id: "powerbi", name: "Microsoft Power BI", pricing_model: "per-seat", tco_tier: 2, security_certs: ["SOC2", "ISO27001", "HIPAA"], has_rest_api: true, connector_tier: "high", report_builder: "hybrid", data_source_breadth: "broad", row_level_security: true, ux_complexity: "moderate", customization_level: "configurable", embed_capability: true, free_tier: true },
  { id: "qlik", name: "Qlik Sense", pricing_model: "consumption", tco_tier: 4, security_certs: ["SOC2", "ISO27001"], has_rest_api: true, connector_tier: "high", report_builder: "dragdrop", data_source_breadth: "broad", row_level_security: true, ux_complexity: "steep", customization_level: "composable", embed_capability: true, free_tier: false },
  { id: "microstrategy", name: "MicroStrategy", pricing_model: "tiered", tco_tier: 5, security_certs: ["SOC2", "ISO27001", "HIPAA"], has_rest_api: true, connector_tier: "high", report_builder: "hybrid", data_source_breadth: "broad", row_level_security: true, ux_complexity: "steep", customization_level: "composable", embed_capability: true, free_tier: false },
  { id: "looker", name: "Looker (Google Cloud)", pricing_model: "consumption", tco_tier: 4, security_certs: ["SOC2", "ISO27001", "HIPAA"], has_rest_api: true, connector_tier: "medium", report_builder: "sql", data_source_breadth: "broad", row_level_security: true, ux_complexity: "steep", customization_level: "composable", embed_capability: true, free_tier: false },
  { id: "sisense", name: "Sisense", pricing_model: "tiered", tco_tier: 4, security_certs: ["SOC2", "ISO27001", "HIPAA"], has_rest_api: true, connector_tier: "high", report_builder: "hybrid", data_source_breadth: "broad", row_level_security: true, ux_complexity: "moderate", customization_level: "composable", embed_capability: true, free_tier: false },
  { id: "domo", name: "Domo", pricing_model: "consumption", tco_tier: 4, security_certs: ["SOC2", "ISO27001", "HIPAA"], has_rest_api: true, connector_tier: "high", report_builder: "dragdrop", data_source_breadth: "broad", row_level_security: true, ux_complexity: "moderate", customization_level: "configurable", embed_capability: true, free_tier: true },
  { id: "zoho", name: "Zoho Analytics", pricing_model: "per-seat", tco_tier: 1, security_certs: ["SOC2", "GDPR"], has_rest_api: true, connector_tier: "medium", report_builder: "dragdrop", data_source_breadth: "medium", row_level_security: true, ux_complexity: "simple", customization_level: "configurable", embed_capability: true, free_tier: true },
  { id: "omni", name: "Omni", pricing_model: "consumption", tco_tier: 3, security_certs: ["SOC2"], has_rest_api: true, connector_tier: "medium", report_builder: "hybrid", data_source_breadth: "broad", row_level_security: true, ux_complexity: "moderate", customization_level: "configurable", embed_capability: true, free_tier: false },
  { id: "sigma", name: "Sigma Computing", pricing_model: "per-seat", tco_tier: 3, security_certs: ["SOC2"], has_rest_api: true, connector_tier: "medium", report_builder: "hybrid", data_source_breadth: "broad", row_level_security: true, ux_complexity: "moderate", customization_level: "configurable", embed_capability: true, free_tier: false },
  { id: "hex", name: "Hex", pricing_model: "consumption", tco_tier: 3, security_certs: ["SOC2"], has_rest_api: true, connector_tier: "medium", report_builder: "sql", data_source_breadth: "broad", row_level_security: false, ux_complexity: "steep", customization_level: "composable", embed_capability: false, free_tier: true },
  { id: "thoughtspot", name: "ThoughtSpot", pricing_model: "consumption", tco_tier: 4, security_certs: ["SOC2", "ISO27001"], has_rest_api: true, connector_tier: "medium", report_builder: "dragdrop", data_source_breadth: "broad", row_level_security: true, ux_complexity: "moderate", customization_level: "configurable", embed_capability: true, free_tier: true },
  { id: "metabase", name: "Metabase", pricing_model: "per-seat", tco_tier: 1, security_certs: ["SOC2"], has_rest_api: true, connector_tier: "medium", report_builder: "hybrid", data_source_breadth: "medium", row_level_security: true, ux_complexity: "simple", customization_level: "configurable", embed_capability: true, free_tier: true },
  { id: "superset", name: "Apache Superset", pricing_model: "free", tco_tier: 1, security_certs: [], has_rest_api: true, connector_tier: "high", report_builder: "hybrid", data_source_breadth: "broad", row_level_security: true, ux_complexity: "steep", customization_level: "composable", embed_capability: true, free_tier: true },
  { id: "lookerstudio", name: "Google Looker Studio", pricing_model: "free", tco_tier: 1, security_certs: [], has_rest_api: true, connector_tier: "medium", report_builder: "dragdrop", data_source_breadth: "medium", row_level_security: false, ux_complexity: "simple", customization_level: "ootb", embed_capability: true, free_tier: true },
];
