import { QUESTIONS, type Question } from "./questions";

function shared(id: string): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown shared question: ${id}`);
  return q;
}

export const WAREHOUSE_QUESTIONS: Question[] = [
  shared("company_size"),
  { ...shared("budget_range"), label: "What's your monthly budget for your data warehouse?" },
  { ...shared("technical_maturity"), label: "Who manages your data infrastructure today?" },
  {
    id: "deployment_model_preference",
    label: "Where do you want your data warehouse to run?",
    type: "single",
    options: [
      "Fully managed cloud (no infra to manage)",
      "Hybrid / some on-prem needed",
      "We want full control (self-hosted)",
    ],
  },
  {
    id: "primary_cloud_provider",
    label: "Which cloud do you primarily run on?",
    type: "single",
    options: [
      "AWS",
      "Google Cloud",
      "Azure",
      "Multi-cloud / no preference",
      "None — we're not cloud-native yet",
    ],
  },
  {
    id: "data_volume_scale",
    label: "How much data are we talking about?",
    type: "single",
    options: ["Small (<100GB)", "Medium (100GB-10TB)", "Large (10TB-1PB)", "Very large (1PB+)"],
  },
  {
    id: "primary_workload",
    label: "What's the main workload?",
    type: "single",
    options: [
      "BI/reporting queries",
      "Real-time / streaming analytics",
      "Data science & ML",
      "Ad-hoc exploration by many analysts",
    ],
  },
  {
    id: "pipeline_ingestion_need",
    label: "Do you need strong built-in data ingestion/pipeline tooling?",
    type: "single",
    options: [
      "Yes, want strong built-in ingestion/pipelines",
      "No, we already have (or will use) a separate ELT tool",
    ],
  },
  {
    id: "real_time_need",
    label: "Do you need real-time / streaming data, or is batch enough?",
    type: "single",
    options: ["Yes, need real-time/streaming", "Batch (hourly/daily) is fine"],
  },
  shared("compliance_needs"),
  shared("customization_preference"),
  {
    id: "current_warehouse_tool",
    label: "What do you use for your data warehouse today, if anything?",
    type: "single",
    render: "dropdown",
    options: [
      "Snowflake",
      "Google BigQuery",
      "Amazon Redshift",
      "Databricks",
      "Microsoft Fabric",
      "ClickHouse Cloud",
      "Firebolt",
      "SingleStore",
      "MotherDuck",
      "Dremio",
      "Teradata Vantage",
      "Oracle Autonomous Data Warehouse",
      "IBM Db2 Warehouse",
      "Yellowbrick Data",
      "Apache Druid",
      "No formal warehouse yet",
      "Something else not listed",
      "Not sure",
    ],
  },
];

export const WAREHOUSE_STEPS: Question[][] = [
  WAREHOUSE_QUESTIONS.slice(0, 3),
  WAREHOUSE_QUESTIONS.slice(3, 6),
  WAREHOUSE_QUESTIONS.slice(6, 9),
  WAREHOUSE_QUESTIONS.slice(9, 11),
  [WAREHOUSE_QUESTIONS[11]],
];
