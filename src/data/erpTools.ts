/**
 * Vendor facts compiled Oct 2026 from public vendor materials and independent ERP
 * comparisons (ERP Research, Costbench, Dupple). Pricing shown elsewhere is indicative
 * starting list price — always confirm with the vendor. Fields marked (editorial) are
 * Platfometrix assessments: ux_complexity, customization_level, connector_tier,
 * multi_entity and manufacturing_depth.
 */
import type { MarketAdoption } from "@/data/marketAdoption";

export type ErpIndustry = "finance" | "distribution" | "manufacturing" | "services";

export interface ErpTool {
  id: string;
  name: string;
  pricing_model: "per-seat" | "consumption" | "quote" | "free";
  tco_tier: number;
  security_certs: string[];
  has_rest_api: boolean;
  /** (editorial) */
  connector_tier: "high" | "medium" | "low";
  /** (editorial) */
  ux_complexity: "simple" | "moderate" | "steep";
  /** (editorial) */
  customization_level: "ootb" | "configurable" | "composable";
  free_tier: boolean;
  deployment_options: ("cloud" | "on_prem" | "hybrid")[];
  industry_strength: ErpIndustry[];
  /** (editorial) */
  manufacturing_depth: "none" | "basic" | "advanced";
  /** (editorial) */
  multi_entity: "basic" | "advanced";
  sweet_spot_sizes: string[];
  implementation_cost_tier: "low" | "medium" | "high";
  time_to_value: "days" | "weeks" | "months";
  hidden_costs: string[];
  market_adoption: MarketAdoption;
}

export const ERP_TOOLS: ErpTool[] = [
  {
    id: "netsuite", name: "Oracle NetSuite", pricing_model: "per-seat", tco_tier: 4,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "high",
    ux_complexity: "steep", customization_level: "composable", free_tier: false,
    deployment_options: ["cloud"], industry_strength: ["distribution", "services", "finance"],
    manufacturing_depth: "basic", multi_entity: "advanced", sweet_spot_sizes: ["51-200", "201-1000", "1000+"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Base platform fee on top of per-user licences",
      "2–3 year minimum terms with auto-renewal; reported annual uplifts of roughly 5–15%",
      "Implementation partner usually needed ($25k–$100k+ typical)",
    ],
    market_adoption: { tier: "Established", note: "The original cloud ERP, widely used by fast-growing mid-market companies, especially software, services and nonprofits." },
  },
  {
    id: "businesscentral", name: "Microsoft Dynamics 365 Business Central", pricing_model: "per-seat", tco_tier: 3,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "high",
    ux_complexity: "moderate", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["distribution", "finance", "services"],
    manufacturing_depth: "basic", multi_entity: "advanced", sweet_spot_sizes: ["1-10", "11-50", "51-200", "201-1000"],
    implementation_cost_tier: "medium", time_to_value: "months",
    hidden_costs: [
      "Premium tier needed for manufacturing features (Essentials ~$80 vs Premium ~$110 per user/month)",
      "Partner usually needed for customisation",
      "Limited-use Team Member licences are cheaper but restricted",
    ],
    market_adoption: { tier: "Established", note: "Strong with small and mid-sized companies already on Microsoft 365, and a common step up from entry-level accounting software." },
  },
  {
    id: "intacct", name: "Sage Intacct", pricing_model: "quote", tco_tier: 4,
    security_certs: ["SOC2", "ISO27001", "GDPR", "HIPAA"], has_rest_api: true, connector_tier: "high",
    ux_complexity: "moderate", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud"], industry_strength: ["finance", "services"],
    manufacturing_depth: "none", multi_entity: "advanced", sweet_spot_sizes: ["51-200", "201-1000"],
    implementation_cost_tier: "medium", time_to_value: "months",
    hidden_costs: [
      "Deliberately finance-first — inventory, manufacturing and operations usually need bolt-on tools",
      "Priced by module and quote only",
    ],
    market_adoption: { tier: "Established", note: "A leading cloud financials platform for services firms and nonprofits, known for its dimensional general ledger and multi-entity consolidation." },
  },
  {
    id: "odoo", name: "Odoo", pricing_model: "per-seat", tco_tier: 2,
    security_certs: [], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "moderate", customization_level: "composable", free_tier: true,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["distribution", "services", "manufacturing"],
    manufacturing_depth: "basic", multi_entity: "basic", sweet_spot_sizes: ["1-10", "11-50", "51-200"],
    implementation_cost_tier: "medium", time_to_value: "weeks",
    hidden_costs: [
      "Enterprise features need the paid edition; Community is free but limited",
      "Customisation and support usually go through Odoo or certified partners",
      "Per-user cost grows with headcount; self-hosting adds infrastructure work",
    ],
    market_adoption: { tier: "Widely adopted", note: "A very popular modular, open-core ERP among startups and small businesses." },
  },
  {
    id: "acumatica", name: "Acumatica", pricing_model: "consumption", tco_tier: 4,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "high",
    ux_complexity: "moderate", customization_level: "composable", free_tier: false,
    deployment_options: ["cloud", "on_prem", "hybrid"], industry_strength: ["distribution", "manufacturing", "services"],
    manufacturing_depth: "basic", multi_entity: "advanced", sweet_spot_sizes: ["51-200", "201-1000"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Consumption-based pricing (no per-user fees) can be harder to predict as transaction volume grows",
      "Partner-delivered implementation (often $60k–$100k)",
      "Smaller partner ecosystem; quality varies by partner",
    ],
    market_adoption: { tier: "Established", note: "Popular with distribution, construction and manufacturing firms that have many occasional users." },
  },
  {
    id: "sapb1", name: "SAP Business One", pricing_model: "per-seat", tco_tier: 3,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "moderate", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["distribution", "manufacturing"],
    manufacturing_depth: "basic", multi_entity: "basic", sweet_spot_sizes: ["1-10", "11-50", "51-200", "201-1000"],
    implementation_cost_tier: "medium", time_to_value: "months",
    hidden_costs: [
      "Sold and implemented through SAP partners",
      "Add-ons and industry solutions are priced separately by partners",
    ],
    market_adoption: { tier: "Established", note: "SAP's long-standing ERP for small and mid-sized companies." },
  },
  {
    id: "epicor", name: "Epicor Kinetic", pricing_model: "per-seat", tco_tier: 4,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "steep", customization_level: "composable", free_tier: false,
    deployment_options: ["cloud", "on_prem", "hybrid"], industry_strength: ["manufacturing", "distribution"],
    manufacturing_depth: "advanced", multi_entity: "basic", sweet_spot_sizes: ["51-200", "201-1000", "1000+"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Manufacturing modules and implementation drive cost; implementation is commonly 2–3x the annual licence",
      "Partner or vendor services needed for configuration",
    ],
    market_adoption: { tier: "Established", note: "Purpose-built for discrete and mixed-mode manufacturers." },
  },
  {
    id: "infor_csi", name: "Infor CloudSuite Industrial (SyteLine)", pricing_model: "quote", tco_tier: 4,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "steep", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["manufacturing", "distribution"],
    manufacturing_depth: "advanced", multi_entity: "basic", sweet_spot_sizes: ["51-200", "201-1000", "1000+"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Quote-based pricing",
      "Industry templates speed set-up but implementation still needs a partner",
    ],
    market_adoption: { tier: "Established", note: "A long-standing manufacturing ERP with industry-specific templates." },
  },
  {
    id: "sagex3", name: "Sage X3", pricing_model: "per-seat", tco_tier: 4,
    security_certs: ["ISO27001", "GDPR"], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "steep", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["manufacturing", "distribution", "finance"],
    manufacturing_depth: "advanced", multi_entity: "advanced", sweet_spot_sizes: ["201-1000", "1000+"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Partner-led implementation is typical",
      "Strongest fit for process manufacturing and multi-site operations, which adds scope",
    ],
    market_adoption: { tier: "Established", note: "Sage's mid-market ERP, strong in process manufacturing and distribution." },
  },
  {
    id: "erpnext", name: "ERPNext", pricing_model: "free", tco_tier: 1,
    security_certs: [], has_rest_api: true, connector_tier: "low",
    ux_complexity: "moderate", customization_level: "composable", free_tier: true,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["distribution", "services", "manufacturing"],
    manufacturing_depth: "basic", multi_entity: "basic", sweet_spot_sizes: ["1-10", "11-50", "51-200"],
    implementation_cost_tier: "medium", time_to_value: "weeks",
    hidden_costs: [
      "Free licence, but self-hosting needs DevOps skills and ongoing maintenance",
      "Thinner partner ecosystem than the commercial vendors",
      "Managed hosting (Frappe Cloud) is available at a modest monthly cost",
    ],
    market_adoption: { tier: "Emerging / niche", note: "A fully open-source ERP with a loyal technical community and no licence fees." },
  },
  {
    id: "syspro", name: "SYSPRO", pricing_model: "per-seat", tco_tier: 3,
    security_certs: [], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "moderate", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["manufacturing", "distribution"],
    manufacturing_depth: "advanced", multi_entity: "basic", sweet_spot_sizes: ["51-200", "201-1000"],
    implementation_cost_tier: "medium", time_to_value: "months",
    hidden_costs: ["Delivered through resellers; services costs vary by partner"],
    market_adoption: { tier: "Established", note: "A long-standing ERP focused on small and mid-sized manufacturers and distributors." },
  },
  {
    id: "zohoone", name: "Zoho One", pricing_model: "per-seat", tco_tier: 2,
    security_certs: ["SOC2", "ISO27001", "GDPR"], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "simple", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud"], industry_strength: ["services", "finance", "distribution"],
    manufacturing_depth: "none", multi_entity: "basic", sweet_spot_sizes: ["1-10", "11-50"],
    implementation_cost_tier: "low", time_to_value: "weeks",
    hidden_costs: [
      "Apps are individually strong but less seamless between modules",
      "Not designed for complex manufacturing or financial consolidation",
      "All-employee licensing means paying for every employee unless you use the flexible plan",
    ],
    market_adoption: { tier: "Widely adopted", note: "A broad, low-cost business suite (finance, inventory, CRM, HR, projects) popular with small businesses." },
  },
  {
    id: "deltek", name: "Deltek Costpoint / Vantagepoint", pricing_model: "per-seat", tco_tier: 4,
    security_certs: [], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "steep", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["services", "finance"],
    manufacturing_depth: "none", multi_entity: "basic", sweet_spot_sizes: ["51-200", "201-1000", "1000+"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Quote-based pricing",
      "Industry-specific configuration (government contracting, architecture/engineering, consulting) adds implementation scope",
    ],
    market_adoption: { tier: "Established", note: "A specialist ERP for project-based firms such as government contractors, architects, engineers and consultancies." },
  },
  {
    id: "priority", name: "Priority ERP", pricing_model: "per-seat", tco_tier: 3,
    security_certs: [], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "moderate", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud", "on_prem"], industry_strength: ["manufacturing", "distribution", "finance"],
    manufacturing_depth: "basic", multi_entity: "basic", sweet_spot_sizes: ["51-200", "201-1000"],
    implementation_cost_tier: "medium", time_to_value: "months",
    hidden_costs: ["Sold through regional partners; services costs vary"],
    market_adoption: { tier: "Emerging / niche", note: "A flexible mid-market ERP with a manufacturing heritage and a smaller global footprint." },
  },
  {
    id: "qad", name: "QAD Adaptive ERP", pricing_model: "per-seat", tco_tier: 4,
    security_certs: [], has_rest_api: true, connector_tier: "medium",
    ux_complexity: "steep", customization_level: "configurable", free_tier: false,
    deployment_options: ["cloud"], industry_strength: ["manufacturing"],
    manufacturing_depth: "advanced", multi_entity: "advanced", sweet_spot_sizes: ["201-1000", "1000+"],
    implementation_cost_tier: "high", time_to_value: "months",
    hidden_costs: [
      "Focused on global manufacturers (automotive, life sciences, consumer products) — more than most small firms need",
      "Implementation is partner/vendor led",
    ],
    market_adoption: { tier: "Established", note: "A specialist cloud ERP for global manufacturers." },
  },
];
