import { supabase } from "@/integrations/supabase/client";

export type HistoryAction = "baseline" | "created" | "updated" | "deleted";
export type FieldChange = { from: unknown; to: unknown };

export interface StackHistoryEntry {
  id: string;
  stack_item_id: string;
  item_name: string;
  action: HistoryAction;
  changes: Record<string, FieldChange> | null;
  created_at: string;
}

export const TRACKED_FIELDS = [
  "name", "category", "item_type", "stage", "owner", "vendor_contact", "cost_amount",
  "cost_period", "currency", "seats", "renewal_date", "notice_days", "auto_renews", "notes",
] as const;
export type TrackedField = (typeof TRACKED_FIELDS)[number];
export type ItemState = Partial<Record<TrackedField, unknown>>;

export async function listStackHistory(
  userId: string,
  opts: { itemId?: string; limit?: number; before?: string } = {},
): Promise<{ entries: StackHistoryEntry[]; hasMore: boolean }> {
  const limit = opts.limit ?? 50;
  let q = supabase
    .from("stack_item_history")
    .select("id, stack_item_id, item_name, action, changes, created_at")
    .eq("user_id", userId);
  if (opts.itemId) q = q.eq("stack_item_id", opts.itemId);
  if (opts.before) q = q.lt("created_at", opts.before);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (error) throw error;
  const rows = (data ?? []) as unknown as StackHistoryEntry[];
  return { entries: rows.slice(0, limit), hasMore: rows.length > limit };
}

export const STAGE_LABEL: Record<string, string> = {
  evaluating: "Evaluating", implementing: "Implementing", live: "Live",
  under_review: "Under review", retired: "Retired",
};
const CATEGORY_LABEL: Record<string, string> = { bi: "BI", crm: "CRM", warehouse: "Data Warehouse", erp: "ERP" };
const FIELD_LABEL: Record<string, string> = {
  name: "Name", category: "Category", item_type: "Type", stage: "Stage", owner: "Owner",
  vendor_contact: "Vendor contact", cost_amount: "Cost amount", cost_period: "Cost period",
  currency: "Currency", seats: "Seats", renewal_date: "Renewal date", notice_days: "Notice period",
  auto_renews: "Auto-renews", notes: "Notes",
};
export const fieldLabel = (f: string) => FIELD_LABEL[f] ?? f;

const empty = (v: unknown) => v === null || v === undefined || v === "";

export function formatValue(field: string, v: unknown): string {
  if (field === "category") return empty(v) ? "Other / none" : CATEGORY_LABEL[String(v)] ?? String(v);
  if (field === "auto_renews") return v === true ? "Yes" : v === false ? "No" : "Unknown";
  if (empty(v)) return "—";
  switch (field) {
    case "stage": return STAGE_LABEL[String(v)] ?? String(v);
    case "item_type": return v === "data_source" ? "Data source" : "Tool";
    case "renewal_date": {
      const d = new Date(String(v).slice(0, 10) + "T00:00:00Z");
      return isNaN(d.getTime())
        ? String(v)
        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    }
    case "notice_days": return `${v} days`;
    case "cost_period": return v === "annual" ? "Annual" : v === "monthly" ? "Monthly" : String(v);
    default: return String(v);
  }
}

export function formatMoney(amount: unknown, period: unknown, currency: unknown): string {
  if (empty(amount)) return "—";
  const n = Number(amount);
  let s: string;
  try {
    s = new Intl.NumberFormat("en-GB", {
      style: "currency", currency: String(currency || "EUR"), maximumFractionDigits: 2, minimumFractionDigits: 0,
    }).format(n);
  } catch {
    s = `${n} ${currency ?? ""}`.trim();
  }
  const p = period === "annual" ? " / year" : period === "monthly" ? " / month" : "";
  return s + p;
}

export function describeChange(field: string, from: unknown, to: unknown): string {
  switch (field) {
    case "name": return `Renamed: ${formatValue(field, from)} → ${formatValue(field, to)}`;
    case "notes": return "Notes edited";
    case "notice_days":
      return `Notice period: ${empty(from) ? "—" : from} → ${empty(to) ? "—" : `${to} days`}`;
    default: return `${fieldLabel(field)}: ${formatValue(field, from)} → ${formatValue(field, to)}`;
  }
}

const COST_FIELDS = ["cost_amount", "cost_period", "currency"] as const;

/**
 * Change lines for an entry. When `before` (state prior to this entry) is given,
 * cost fields are merged into a single "Cost" line; otherwise shown separately.
 */
export function describeEntryChanges(
  changes: Record<string, FieldChange> | null,
  before?: ItemState | null,
): string[] {
  if (!changes) return [];
  const lines: string[] = [];
  const costChanged = COST_FIELDS.some((f) => f in changes);
  if (costChanged && before) {
    const pick = (f: string, side: "from" | "to") => (f in changes ? changes[f][side] : before[f as TrackedField]);
    lines.push(
      `Cost: ${formatMoney(pick("cost_amount", "from"), pick("cost_period", "from"), pick("currency", "from"))} → ${formatMoney(pick("cost_amount", "to"), pick("cost_period", "to"), pick("currency", "to"))}`,
    );
  }
  for (const f of TRACKED_FIELDS) {
    if (!(f in changes)) continue;
    if (costChanged && before && (COST_FIELDS as readonly string[]).includes(f)) continue;
    lines.push(describeChange(f, changes[f].from, changes[f].to));
  }
  return lines;
}

export interface ReconstructedState {
  entryId: string;
  state: ItemState;
  before: ItemState;
  deleted: boolean;
}

/** Entries for ONE item, oldest → newest. Returns state after each entry. */
export function reconstructItemStates(entries: StackHistoryEntry[]): ReconstructedState[] {
  let state: ItemState = {};
  let deleted = false;
  return entries.map((e) => {
    const before = { ...state };
    if (e.action === "deleted") {
      deleted = true;
    } else {
      const next: ItemState = e.action === "baseline" || e.action === "created" ? {} : { ...state };
      if (e.action !== "updated") deleted = false;
      for (const [k, c] of Object.entries(e.changes ?? {})) next[k as TrackedField] = c.to;
      state = next;
    }
    return { entryId: e.id, state, before, deleted };
  });
}

function norm(field: string, v: unknown): unknown {
  if (empty(v)) return null;
  if (field === "cost_amount" || field === "seats" || field === "notice_days") return Number(v);
  if (field === "renewal_date") return String(v).slice(0, 10);
  return v;
}

export function diffStates(a: ItemState, b: ItemState): TrackedField[] {
  return TRACKED_FIELDS.filter((f) => norm(f, a[f]) !== norm(f, b[f]));
}
