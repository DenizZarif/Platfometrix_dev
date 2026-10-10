import type { StackItem } from "./stackStore";

export type StageKey = StackItem["stage"];
export type CategoryKey = "bi" | "crm" | "warehouse" | "erp" | "other";

export interface UpcomingEvent {
  kind: "renewal" | "notice" | "passed";
  item: StackItem;
  date: Date;
  daysAway: number;
}

export interface StackInsights {
  totals: { all: number; tools: number; dataSources: number };
  byStage: Record<StageKey, number>;
  byCategory: Record<CategoryKey, number>;
  spend: Record<string, { annual: number; itemsCounted: number }>;
  spendMissingCost: number;
  upcoming: UpcomingEvent[];
  attention: { liveMissingOwner: number; liveMissingRenewal: number; liveMissingCost: number };
}

const DAY = 86_400_000;
const SPEND_STAGES: StageKey[] = ["live", "implementing", "under_review"];

export function computeStackInsights(items: StackItem[], now: Date = new Date()): StackInsights {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const byStage: Record<StageKey, number> = { evaluating: 0, implementing: 0, live: 0, under_review: 0, retired: 0 };
  const byCategory: Record<CategoryKey, number> = { bi: 0, crm: 0, warehouse: 0, erp: 0, other: 0 };
  const spend: StackInsights["spend"] = {};
  const attention = { liveMissingOwner: 0, liveMissingRenewal: 0, liveMissingCost: 0 };
  const passed: UpcomingEvent[] = [];
  const future: UpcomingEvent[] = [];
  let spendMissingCost = 0;
  let tools = 0;

  for (const item of items) {
    if (item.item_type === "data_source") {
      // counted below via all - tools
    } else tools++;
    byStage[item.stage] = (byStage[item.stage] ?? 0) + 1;
    byCategory[item.category ?? "other"]++;

    if (SPEND_STAGES.includes(item.stage)) {
      if (item.cost_amount != null && item.cost_period) {
        const cur = item.currency || "EUR";
        const entry = (spend[cur] ??= { annual: 0, itemsCounted: 0 });
        entry.annual += item.cost_period === "monthly" ? item.cost_amount * 12 : item.cost_amount;
        entry.itemsCounted++;
      } else spendMissingCost++;
    }

    if (item.stage === "live") {
      if (!item.owner) attention.liveMissingOwner++;
      if (!item.renewal_date) attention.liveMissingRenewal++;
      if (item.cost_amount == null || !item.cost_period) attention.liveMissingCost++;
    }

    if (item.stage !== "retired" && item.renewal_date) {
      const date = new Date(`${item.renewal_date.slice(0, 10)}T00:00:00Z`);
      const daysAway = Math.round((date.getTime() - today) / DAY);
      if (daysAway < 0) {
        if (item.auto_renews !== true) passed.push({ kind: "passed", item, date, daysAway });
      } else {
        if (daysAway <= 90) future.push({ kind: "renewal", item, date, daysAway });
        if (item.notice_days != null && daysAway > 0) {
          const nDate = new Date(date.getTime() - item.notice_days * DAY);
          const nDays = daysAway - item.notice_days;
          if (nDays >= 0 && nDays <= 90) future.push({ kind: "notice", item, date: nDate, daysAway: nDays });
        }
      }
    }
  }

  const byDate = (a: UpcomingEvent, b: UpcomingEvent) => a.date.getTime() - b.date.getTime();
  return {
    totals: { all: items.length, tools, dataSources: items.length - tools },
    byStage,
    byCategory,
    spend,
    spendMissingCost,
    upcoming: [...passed.sort(byDate), ...future.sort(byDate)],
    attention,
  };
}
