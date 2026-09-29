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
  created_at: string;
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
    .select("id, category, tool_id, name, answers, stage, source, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StackItem[];
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
    })
    .select("id, category, tool_id, name, answers, stage, source, created_at")
    .single();
  if (error) throw error;
  return data as unknown as StackItem;
}

export async function addManualStackItem(
  userId: string,
  name: string,
  category: Category | null,
): Promise<StackItem> {
  const { data, error } = await supabase
    .from("stack_items")
    .insert({ user_id: userId, name, category, source: "manual" })
    .select("id, category, tool_id, name, answers, stage, source, created_at")
    .single();
  if (error) throw error;
  return data as unknown as StackItem;
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
