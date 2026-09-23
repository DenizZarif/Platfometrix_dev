import type { Category } from "@/lib/categories";

export interface Scenario {
  id: string;
  label: string;
  blurb: string;
  weights: Record<string, number>;
}

export const SCENARIOS: Record<Category, Scenario[]> = {
  bi: [
    {
      id: "cost-conscious",
      label: "Cost-conscious",
      blurb: "Prioritizes staying within budget above everything else",
      weights: { budget_fit: 70, report_builder_fit: 10, ux_complexity_fit: 15, embed_fit: 5, connector_richness_fit: 10, data_source_fit: 10, customization_fit: 10, security_soft_fit: 5 },
    },
    {
      id: "best-functionality",
      label: "Best functionality",
      blurb: "Prioritizes deeper features and capabilities over cost or ease of use",
      weights: { budget_fit: 5, report_builder_fit: 25, ux_complexity_fit: 10, embed_fit: 20, connector_richness_fit: 20, data_source_fit: 20, customization_fit: 15, security_soft_fit: 5 },
    },
    {
      id: "easiest-to-adopt",
      label: "Easiest to adopt",
      blurb: "Prioritizes a gentle learning curve and out-of-the-box fit",
      weights: { budget_fit: 10, report_builder_fit: 10, ux_complexity_fit: 40, embed_fit: 5, connector_richness_fit: 10, data_source_fit: 10, customization_fit: 25, security_soft_fit: 5 },
    },
    {
      id: "compliance-first",
      label: "Compliance-first",
      blurb: "Prioritizes strong security and compliance credentials",
      weights: { budget_fit: 10, report_builder_fit: 10, ux_complexity_fit: 10, embed_fit: 5, connector_richness_fit: 10, data_source_fit: 10, customization_fit: 5, security_soft_fit: 60 },
    },
  ],
  crm: [
    {
      id: "cost-conscious",
      label: "Cost-conscious",
      blurb: "Prioritizes staying within budget above everything else",
      weights: { budget_fit: 70, customization_fit: 10, ux_complexity_fit: 15, email_calling_fit: 10, marketing_automation_fit: 5, mobile_fit: 10, reporting_fit: 10, connector_richness_fit: 10, security_soft_fit: 5 },
    },
    {
      id: "best-functionality",
      label: "Best functionality",
      blurb: "Prioritizes deeper features and capabilities over cost or ease of use",
      weights: { budget_fit: 5, customization_fit: 15, ux_complexity_fit: 10, email_calling_fit: 20, marketing_automation_fit: 25, mobile_fit: 15, reporting_fit: 25, connector_richness_fit: 20, security_soft_fit: 5 },
    },
    {
      id: "easiest-to-adopt",
      label: "Easiest to adopt",
      blurb: "Prioritizes a gentle learning curve and out-of-the-box fit",
      weights: { budget_fit: 10, customization_fit: 25, ux_complexity_fit: 45, email_calling_fit: 10, marketing_automation_fit: 5, mobile_fit: 10, reporting_fit: 10, connector_richness_fit: 10, security_soft_fit: 5 },
    },
    {
      id: "compliance-first",
      label: "Compliance-first",
      blurb: "Prioritizes strong security and compliance credentials",
      weights: { budget_fit: 10, customization_fit: 5, ux_complexity_fit: 10, email_calling_fit: 5, marketing_automation_fit: 5, mobile_fit: 5, reporting_fit: 10, connector_richness_fit: 10, security_soft_fit: 65 },
    },
  ],
  warehouse: [
    {
      id: "cost-conscious",
      label: "Cost-conscious",
      blurb: "Prioritizes staying within budget above everything else",
      weights: { budget_fit: 65, data_scale_fit: 10, workload_fit: 10, ux_complexity_fit: 10, deployment_fit: 10, cloud_provider_fit: 10, pipeline_ingestion_fit: 10, real_time_fit: 5, customization_fit: 10, security_soft_fit: 5 },
    },
    {
      id: "best-functionality",
      label: "Best functionality",
      blurb: "Prioritizes deeper features and capabilities over cost or ease of use",
      weights: { budget_fit: 5, data_scale_fit: 15, workload_fit: 25, ux_complexity_fit: 10, deployment_fit: 10, cloud_provider_fit: 15, pipeline_ingestion_fit: 20, real_time_fit: 20, customization_fit: 15, security_soft_fit: 5 },
    },
    {
      id: "easiest-to-adopt",
      label: "Easiest to adopt",
      blurb: "Prioritizes a gentle learning curve and out-of-the-box fit",
      weights: { budget_fit: 10, data_scale_fit: 10, workload_fit: 10, ux_complexity_fit: 45, deployment_fit: 15, cloud_provider_fit: 10, pipeline_ingestion_fit: 10, real_time_fit: 5, customization_fit: 25, security_soft_fit: 5 },
    },
    {
      id: "compliance-first",
      label: "Compliance-first",
      blurb: "Prioritizes strong security and compliance credentials",
      weights: { budget_fit: 10, data_scale_fit: 10, workload_fit: 10, ux_complexity_fit: 10, deployment_fit: 10, cloud_provider_fit: 10, pipeline_ingestion_fit: 10, real_time_fit: 5, customization_fit: 5, security_soft_fit: 65 },
    },
  ],
};
