import { supabase } from "@/integrations/supabase/client";
import type { Answers } from "./questions";
import type { Category } from "./categories";

export interface StackItem {
  id: string;
  category: Category | null;
  tool_id: string | null;
  name: string;
  answers: Answers | null;
  stage: "evaluating" | "implementing" | "live" | "under_review" | "retired";
  source: "manual" | "saved_result";
  item_type: "tool" | "data_source";
  created_at: string;
  notes: string | null;
  owner: string | null;
  vendor_contact: string | null;
  cost_amount: number | null;
  cost_period: "monthly" | "annual" | null;
  currency: "EUR" | "USD" | "GBP";
  seats: number | null;
  renewal_date: string | null;
  notice_days: number | null;
  auto_renews: boolean | null;
}

const ITEM_COLS =
  "id, category, tool_id, name, answers, stage, source, item_type, created_at, notes, owner, vendor_contact, cost_amount, cost_period, currency, seats, renewal_date, notice_days, auto_renews";

function normalise(row: unknown): StackItem {
  const r = row as StackItem & { cost_amount: number | string | null };
  return { ...r, cost_amount: r.cost_amount == null ? null : Number(r.cost_amount) };
}

export interface StackChecklistItem {
  id: string;
  stack_item_id: string;
  label: string;
  detail: string | null;
  done: boolean;
  owner: string | null;
  target_date: string | null;
  sort_order: number;
}

export async function listStackItems(userId: string): Promise<StackItem[]> {
  const { data, error } = await supabase
    .from("stack_items")
    .select(ITEM_COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalise);
}

export async function addStackItemFromMatch(
  userId: string,
  category: Category,
  tool: { id: string; name: string },
  answers: Answers,
): Promise<StackItem> {
  const { data, error } = await supabase
    .from("stack_items")
    .insert({
      user_id: userId,
      category,
      tool_id: tool.id,
      name: tool.name,
      answers: answers as unknown as never,
      source: "saved_result",
      item_type: "tool",
    })
    .select(ITEM_COLS)
    .single();
  if (error) throw error;
  return normalise(data);
}

export async function addManualStackItem(
  userId: string,
  name: string,
  category: Category | null,
  itemType: "tool" | "data_source" = "tool",
): Promise<StackItem> {
  const { data, error } = await supabase
    .from("stack_items")
    .insert({ user_id: userId, name, category, item_type: itemType, source: "manual" })
    .select(ITEM_COLS)
    .single();
  if (error) throw error;
  return normalise(data);
}

export async function updateStackItemStage(id: string, stage: StackItem["stage"]): Promise<void> {
  const { error } = await supabase
    .from("stack_items")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStackItem(id: string): Promise<void> {
  const { error } = await supabase.from("stack_items").delete().eq("id", id);
  if (error) throw error;
}

export async function listChecklistItems(stackItemId: string): Promise<StackChecklistItem[]> {
  const { data, error } = await supabase
    .from("stack_checklist_items")
    .select("id, stack_item_id, label, detail, done, owner, target_date, sort_order")
    .eq("stack_item_id", stackItemId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as StackChecklistItem[];
}

export async function seedSetupChecklist(
  stackItemId: string,
  phases: { phase: string; description: string }[],
): Promise<void> {
  const rows = phases.map((p, i) => ({
    stack_item_id: stackItemId,
    kind: "setup",
    label: p.phase,
    detail: p.description,
    sort_order: i,
  }));
  const { error } = await supabase.from("stack_checklist_items").insert(rows);
  if (error) throw error;
}

export async function addChecklistItem(stackItemId: string, label: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from("stack_checklist_items")
    .insert({ stack_item_id: stackItemId, kind: "setup", label, sort_order: sortOrder });
  if (error) throw error;
}

export async function toggleChecklistItem(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("stack_checklist_items")
    .update({ done, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateChecklistItemFields(
  id: string,
  fields: { owner?: string | null; target_date?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("stack_checklist_items")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from("stack_checklist_items").delete().eq("id", id);
  if (error) throw error;
}

export type StackContractFields = Partial<
  Pick<
    StackItem,
    | "owner" | "cost_amount" | "cost_period" | "currency" | "seats" | "renewal_date"
    | "notice_days" | "auto_renews" | "vendor_contact" | "notes"
  >
>;

export interface BulkStackRow extends StackContractFields {
  name: string;
  category: Category | null;
  itemType: "tool" | "data_source";
  stage: StackItem["stage"];
}

export type StackItemPatch = StackContractFields &
  Partial<Pick<StackItem, "name" | "category" | "item_type" | "stage">>;

export async function updateStackItem(id: string, patch: StackItemPatch): Promise<void> {
  const clean: Record<string, unknown> = { ...patch };
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) throw new Error("Name is required");
    clean["name"] = n;
  }
  const { error } = await supabase
    .from("stack_items")
    .update({ ...clean, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

const CSV_COLUMNS = [
  "name", "type", "category", "stage", "owner", "cost", "cost_period", "currency", "seats",
  "renewal_date", "notice_days", "auto_renews", "vendor_contact", "notes",
] as const;

function csvCell(v: string, isText: boolean): string {
  let s = v;
  if (isText && /^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function stackItemsToCsv(items: StackItem[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const i of items) {
    const t = (v: string | null) => csvCell(v ?? "", true);
    const n = (v: number | null) => (v == null ? "" : String(v));
    lines.push(
      [
        t(i.name), i.item_type, i.category ?? "", i.stage, t(i.owner), n(i.cost_amount),
        i.cost_period ?? "", i.currency ?? "", n(i.seats), i.renewal_date?.slice(0, 10) ?? "",
        n(i.notice_days), i.auto_renews == null ? "" : i.auto_renews ? "yes" : "no",
        t(i.vendor_contact), t(i.notes),
      ].join(","),
    );
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export async function bulkAddStackItems(
  userId: string,
  rows: BulkStackRow[],
): Promise<{ added: number; skipped: number }> {
  const existing = await listStackItems(userId);
  const existingNames = new Set(existing.map((i) => i.name.trim().toLowerCase()));
  const toInsert = rows.filter((r) => {
    const key = r.name.trim().toLowerCase();
    if (!key || existingNames.has(key)) return false;
    existingNames.add(key); // also skip repeats within this batch
    return true;
  });
  const skipped = rows.length - toInsert.length;
  if (toInsert.length === 0) return { added: 0, skipped };
  const { error } = await supabase.from("stack_items").insert(
    toInsert.map((r) => ({
      user_id: userId,
      name: r.name.trim(),
      category: r.category,
      item_type: r.itemType,
      stage: r.stage,
      source: "manual",
      ...(r.owner != null && { owner: r.owner }),
      ...(r.cost_amount != null && { cost_amount: r.cost_amount }),
      ...(r.cost_period != null && { cost_period: r.cost_period }),
      ...(r.currency != null && { currency: r.currency }),
      ...(r.seats != null && { seats: r.seats }),
      ...(r.renewal_date != null && { renewal_date: r.renewal_date }),
      ...(r.notice_days != null && { notice_days: r.notice_days }),
      ...(r.auto_renews != null && { auto_renews: r.auto_renews }),
      ...(r.vendor_contact != null && { vendor_contact: r.vendor_contact }),
      ...(r.notes != null && { notes: r.notes }),
    })),
  );
  if (error) throw error;
  return { added: toInsert.length, skipped };
}
