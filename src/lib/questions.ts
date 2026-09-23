export interface Question {
  id: string;
  label: string;
  help?: string;
  type: "single" | "multi";
  options: string[];
  render?: "buttons" | "dropdown";
}

export const QUESTIONS: Question[] = [
  { id: "company_size", label: "How big is your company?", type: "single", options: ["1-10", "11-50", "51-200", "201-1000", "1000+"] },
  { id: "budget_range", label: "What's your monthly budget for BI?", type: "single", options: ["Free tools only", "Under $500/mo", "$500-2,000/mo", "$2,000-10,000/mo", "$10,000+/mo", "Not sure yet"] },
  { id: "technical_maturity", label: "Who works with data today?", type: "single", options: ["No dedicated data person", "Part-time / shared analyst", "One dedicated analyst", "Full data team"] },
  { id: "primary_use_case", label: "What's the main thing you need it for?", type: "single", options: ["Executive dashboards", "Self-service exploration for business users", "Embedding analytics into our own product", "Ad-hoc, SQL-heavy analysis"] },
  { id: "report_builder_preference", label: "How do you want to build reports?", type: "single", options: ["Pure drag-and-drop, no SQL", "Comfortable writing SQL", "Need both options available"] },
  { id: "compliance_needs", label: "Any compliance requirements?", help: "Select all that apply.", type: "multi", options: ["SOC 2", "HIPAA", "GDPR", "ISO 27001", "None required", "Not sure"] },
  { id: "row_level_security_required", label: "Do you need row-level security?", help: "Different users seeing different slices of the same dashboard.", type: "single", options: ["Yes", "No", "Not sure"] },
  { id: "embed_needed", label: "Do you need to embed dashboards elsewhere?", type: "single", options: ["Yes, we need to embed dashboards in our own product/portal", "No, internal use only"] },
  { id: "primary_data_source", label: "Where does your data live?", type: "single", options: ["Spreadsheets/files", "One cloud warehouse (Snowflake/BigQuery/Redshift)", "Multiple disparate sources", "Databases only"] },
  { id: "data_volume", label: "How much data are we talking about?", type: "single", options: ["Small (<1M rows)", "Medium (1-100M rows)", "Large (100M+ rows)", "Not sure"] },
  { id: "customization_preference", label: "Out of the box, or tailored?", type: "single", options: ["Works well out of the box", "Happy to configure/customize to fit our process"] },
  {
    id: "current_bi_tool",
    label: "What do you use for BI/reporting today, if anything?",
    type: "single",
    render: "dropdown",
    options: [
      "Tableau",
      "Microsoft Power BI",
      "Qlik Sense",
      "MicroStrategy",
      "Looker (Google Cloud)",
      "Sisense",
      "Domo",
      "Zoho Analytics",
      "Omni",
      "Sigma Computing",
      "Hex",
      "ThoughtSpot",
      "Metabase",
      "Apache Superset",
      "Google Looker Studio",
      "Spreadsheets / manual reporting",
      "Nothing yet — this would be our first BI tool",
      "Something else not listed",
      "Not sure",
    ],
  },
];

export const STEPS: Question[][] = [
  QUESTIONS.slice(0, 3),
  QUESTIONS.slice(3, 5),
  QUESTIONS.slice(5, 8),
  QUESTIONS.slice(8, 11),
  [QUESTIONS[11]],
];

export type Answers = Record<string, string | string[]>;
