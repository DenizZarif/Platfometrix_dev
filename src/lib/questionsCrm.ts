import { QUESTIONS, type Question } from "./questions";

function shared(id: string): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown shared question: ${id}`);
  return q;
}

export const CRM_QUESTIONS: Question[] = [
  shared("company_size"),
  { ...shared("budget_range"), label: "What's your monthly software budget?" },
  { ...shared("technical_maturity"), label: "Who manages your CRM today?" },
  {
    id: "email_calling_need",
    label: "Do you need built-in email sync and calling?",
    type: "single",
    options: ["Yes, need built-in email sync + calling", "No, we use separate tools for that"],
  },
  {
    id: "marketing_automation_need",
    label: "Do you want marketing automation bundled in?",
    type: "single",
    options: ["Yes, want marketing automation bundled in", "No, marketing is a separate tool/team"],
  },
  {
    id: "mobile_usage",
    label: "How does your team work day to day?",
    type: "single",
    options: ["Team mostly works from a desk", "Team is often in the field / needs a strong mobile app"],
  },
  {
    id: "reporting_need",
    label: "How deep does your reporting need to go?",
    type: "single",
    options: ["Basic pipeline visibility is enough", "Need advanced forecasting & reporting"],
  },
  shared("compliance_needs"),
  shared("customization_preference"),
  {
    id: "current_crm_tool",
    label: "What do you use for CRM today, if anything?",
    type: "single",
    render: "dropdown",
    options: [
      "Salesforce Sales Cloud",
      "Microsoft Dynamics 365 Sales",
      "HubSpot CRM",
      "Zoho CRM",
      "Pipedrive",
      "Freshsales",
      "Copper",
      "Close",
      "Nutshell",
      "Attio",
      "Folk",
      "monday Sales CRM",
      "Insightly",
      "SugarCRM",
      "SuiteCRM",
      "Spreadsheets or a shared inbox",
      "Nothing yet — this would be our first CRM",
      "Something else not listed",
      "Not sure",
    ],
  },
];

export const CRM_STEPS: Question[][] = [
  CRM_QUESTIONS.slice(0, 3),
  CRM_QUESTIONS.slice(3, 5),
  CRM_QUESTIONS.slice(5, 7),
  CRM_QUESTIONS.slice(7, 9),
  [CRM_QUESTIONS[9]],
];
