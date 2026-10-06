import { QUESTIONS, type Question } from "./questions";
import { ERP_TOOLS } from "@/data/erpTools";

function shared(id: string): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown shared question: ${id}`);
  return q;
}

export const ERP_QUESTIONS: Question[] = [
  shared("company_size"),
  { ...shared("budget_range"), label: "What's your monthly software budget for ERP?" },
  {
    id: "erp_admin_capacity",
    label: "Who would own the ERP day to day?",
    type: "single",
    options: [
      "No dedicated admin — it needs to be simple",
      "Part-time admin or finance lead",
      "One dedicated systems administrator",
      "A full IT / systems team",
    ],
  },
  {
    id: "erp_primary_need",
    label: "What's the biggest thing the ERP must do well?",
    type: "single",
    options: [
      "Finance & accounting (GL, AP/AR, consolidation)",
      "Distribution & inventory (stock, orders, warehouses)",
      "Manufacturing (BOMs, production, shop floor)",
      "Services & projects (time, billing, project accounting)",
      "A bit of everything — general business",
    ],
  },
  {
    id: "erp_entity_structure",
    label: "How is your business structured?",
    type: "single",
    options: [
      "Single legal entity, single currency",
      "Multiple entities and/or currencies (consolidation needed)",
    ],
  },
  {
    id: "erp_deployment_pref",
    label: "Where should the ERP run?",
    type: "single",
    options: ["Cloud only is fine", "We need an on-premise or hybrid option"],
  },
  shared("compliance_needs"),
  shared("customization_preference"),
  {
    id: "current_erp_tool",
    label: "What do you use for ERP / back-office today, if anything?",
    type: "single",
    render: "dropdown",
    options: [
      ...ERP_TOOLS.map((t) => t.name),
      "QuickBooks or other entry-level accounting software",
      "Spreadsheets / manual processes",
      "Nothing yet — this would be our first ERP",
      "Something else not listed",
      "Not sure",
    ],
  },
];

export const ERP_STEPS: Question[][] = [
  ERP_QUESTIONS.slice(0, 3),
  ERP_QUESTIONS.slice(3, 5),
  ERP_QUESTIONS.slice(5, 7),
  ERP_QUESTIONS.slice(7, 9),
];
