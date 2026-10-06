import { STEPS, QUESTIONS, type Answers, type Question } from "@/lib/questions";
import { CRM_STEPS, CRM_QUESTIONS } from "@/lib/questionsCrm";
import { WAREHOUSE_STEPS, WAREHOUSE_QUESTIONS } from "@/lib/questionsWarehouse";
import { ERP_STEPS, ERP_QUESTIONS } from "@/lib/questionsErp";
import { matchTools } from "@/lib/matcher";
import { matchCrmTools } from "@/lib/matcherCrm";
import { matchWarehouseTools } from "@/lib/matcherWarehouse";
import { matchErpTools } from "@/lib/matcherErp";
import type { ShortlistResult } from "@/components/ResultCard";

export type Category = "bi" | "crm" | "warehouse" | "erp";

export const CATEGORIES: Category[] = ["bi", "crm", "warehouse", "erp"];

export function isCategory(v: unknown): v is Category {
  return v === "bi" || v === "crm" || v === "warehouse" || v === "erp";
}

export const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    tagline: string;
    steps: Question[][];
    questions: Question[];
    toolCount: number;
    headline: React.ReactNode;
    blurb: string;
    headerNote: string;
  }
> = {
  bi: {
    label: "BI & Reporting",
    tagline: "Dashboards, analytics and reporting for your data.",
    steps: STEPS,
    questions: QUESTIONS,
    toolCount: 15,
    headline: (
      <>
        Find the BI tool that <span className="text-accent">actually fits</span> your team
      </>
    ),
    blurb:
      "This isn't another \"best BI tools\" list — it's a personalized match scored against your budget, your team's skills and the way your data is actually set up.",
    headerNote: "BI / reporting tool matcher",
  },
  crm: {
    label: "CRM",
    tagline: "Pipeline, contacts and sales workflow for your team.",
    steps: CRM_STEPS,
    questions: CRM_QUESTIONS,
    toolCount: 15,
    headline: (
      <>
        Find the CRM that <span className="text-accent">actually fits</span> your team
      </>
    ),
    blurb:
      "This isn't another \"best CRM\" list — it's a personalized match scored against your budget, how your team sells and how much set-up you're willing to do.",
    headerNote: "CRM tool matcher",
  },
  warehouse: {
    label: "Data Warehousing & Pipelines",
    tagline: "Where your analytical data lives, scales and gets loaded.",
    steps: WAREHOUSE_STEPS,
    questions: WAREHOUSE_QUESTIONS,
    toolCount: 15,
    headline: (
      <>
        Find the data warehouse that <span className="text-accent">actually fits</span> your team
      </>
    ),
    blurb:
      "This isn't another \"best data warehouse\" list — it's a personalized match scored against your scale, workload, cloud setup and how much infrastructure you want to manage.",
    headerNote: "Data warehouse matcher",
  },
  erp: {
    label: "ERP",
    tagline: "Finance, inventory, operations and orders in one system.",
    steps: ERP_STEPS,
    questions: ERP_QUESTIONS,
    toolCount: 15,
    headline: (
      <>
        Find the ERP that <span className="text-accent">actually fits</span> your business
      </>
    ),
    blurb:
      "This isn't another \"best ERP\" list — it's a personalized match scored against your size, budget, industry needs, entity structure and how much implementation effort you can take on.",
    headerNote: "ERP matcher",
  },
};

export const MATCHERS: Record<
  Category,
  (a: Answers, weightOverrides?: Partial<Record<string, number>>) => ShortlistResult[]
> = {
  bi: matchTools,
  crm: matchCrmTools,
  warehouse: matchWarehouseTools,
  erp: matchErpTools,
};
