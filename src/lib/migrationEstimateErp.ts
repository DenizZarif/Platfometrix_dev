import { ERP_TOOLS, type ErpTool } from "@/data/erpTools";
import type { Answers } from "./questions";
import type { Profile } from "./profileStore";
import type { MigrationEstimate } from "./migrationEstimate";
import { estimateErpCost } from "./costEstimateErp";

const NOT_APPLICABLE: MigrationEstimate = {
  applicable: false,
  currentToolLabel: null,
  effort: { label: "Low", rationale: "" },
  whatMoves: [],
  costNote: "",
};

const LIGHT_SOURCES = [
  "Spreadsheets / manual processes",
  "QuickBooks or other entry-level accounting software",
];

const BASE_MONTHS: Record<ErpTool["implementation_cost_tier"], [number, number]> = {
  low: [1, 3],
  medium: [3, 6],
  high: [6, 12],
};

const SIZE_FACTOR: Record<string, number> = {
  "1-10": 0.75,
  "11-50": 0.85,
  "51-200": 1,
  "201-1000": 1.25,
  "1000+": 1.5,
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function buildErpMigrationEstimate(
  currentAnswer: string | undefined,
  candidateTool: ErpTool,
  answers: Answers,
  profile: Profile | null,
): MigrationEstimate {
  if (
    !currentAnswer ||
    currentAnswer === "Nothing yet — this would be our first ERP" ||
    currentAnswer === "Not sure" ||
    currentAnswer === candidateTool.name
  ) {
    return NOT_APPLICABLE;
  }

  const sizeRaw = profile?.company_size ?? answers["company_size"];
  const size = typeof sizeRaw === "string" ? sizeRaw : undefined;
  const light = LIGHT_SOURCES.includes(currentAnswer);
  const currentTool = ERP_TOOLS.find((t) => t.name === currentAnswer);

  const [lo, hi] = BASE_MONTHS[candidateTool.implementation_cost_tier];
  const factor = (SIZE_FACTOR[size ?? ""] ?? 1) * (light ? 0.75 : currentTool ? 1.25 : 1);
  const low = Math.max(1, Math.round(lo * factor));
  const high = Math.max(low + 1, Math.round(hi * factor));

  const drivers: string[] = [];
  if (!light) drivers.push(currentTool ? "moving from another full ERP" : "moving from an existing back-office system");
  if (candidateTool.implementation_cost_tier === "high") drivers.push(`${candidateTool.name}'s heavy implementation`);
  if (size === "201-1000" || size === "1000+") drivers.push("coordination across a large organization");

  const label: MigrationEstimate["effort"]["label"] =
    light && candidateTool.implementation_cost_tier !== "high" ? "Moderate" : "High";

  const rationale = `${label} effort, roughly ${low}–${high} months — ERP migrations are heavy${drivers.length ? `, mainly driven by ${drivers.join(", ")}` : ""}.`;

  const whatMoves = [
    "General ledger and opening balances",
    "Customers and vendors",
    "Item master and inventory balances",
    "Open purchase and sales orders",
    light
      ? "Historical transactions you want to keep (often summarized rather than moved line by line)"
      : `Historical transactions from ${currentAnswer} — decide how many years to bring across`,
  ];

  let costNote = "Plan cutover for a period-end or quarter boundary so opening balances are clean.";
  if (currentTool) {
    const a = estimateErpCost(currentTool, size);
    const b = estimateErpCost(candidateTool, size);
    costNote = `Indicatively, ${currentTool.name} runs about ${money(a.monthlyLow)}–${money(a.monthlyHigh)}/mo versus ${money(b.monthlyLow)}–${money(b.monthlyHigh)}/mo for ${candidateTool.name}, before implementation. ${costNote}`;
  }

  return {
    applicable: true,
    currentToolLabel: currentAnswer,
    effort: { label, rationale },
    whatMoves,
    costNote,
  };
}
