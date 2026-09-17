import { supabase } from "@/integrations/supabase/client";
import type { Answers } from "./questions";
import type { ShortlistResult } from "@/components/ResultCard";

export const UNIVERSAL_FIELDS = [
  "company_size",
  "budget_range",
  "technical_maturity",
  "compliance_needs",
  "customization_preference",
] as const;

export interface Profile {
  id: string;
  company_size: string | null;
  budget_range: string | null;
  technical_maturity: string | null;
  compliance_needs: string[] | null;
  customization_preference: string | null;
  company_name: string | null;
  job_title: string | null;
  industry: string | null;
  company_website: string | null;
  growth_stage: string | null;
  existing_stack: string | null;
  digital_assets: string | null;
}

export interface SavedResultRow {
  id: string;
  category: "bi" | "crm";
  answers: Answers;
  results: ShortlistResult[];
  created_at: string;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_size, budget_range, technical_maturity, compliance_needs, customization_preference")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

type ProfileFields = Omit<Profile, "id">;

export async function upsertProfile(userId: string, fields: Partial<ProfileFields>) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function profileFieldsFromAnswers(answers: Answers): Partial<ProfileFields> {
  const out: Partial<ProfileFields> = {};
  for (const key of UNIVERSAL_FIELDS) {
    const v = answers[key];
    if (v === undefined) continue;
    if (key === "compliance_needs") {
      out.compliance_needs = Array.isArray(v) ? v : [v];
    } else if (typeof v === "string") {
      out[key] = v;
    }
  }
  return out;
}

export function answersFromProfile(profile: Profile | null): Answers {
  if (!profile) return {};
  const out: Answers = {};
  if (profile.company_size) out["company_size"] = profile.company_size;
  if (profile.budget_range) out["budget_range"] = profile.budget_range;
  if (profile.technical_maturity) out["technical_maturity"] = profile.technical_maturity;
  if (profile.compliance_needs?.length) out["compliance_needs"] = profile.compliance_needs;
  if (profile.customization_preference)
    out["customization_preference"] = profile.customization_preference;
  return out;
}

export async function saveResult(
  userId: string,
  category: "bi" | "crm",
  answers: Answers,
  results: ShortlistResult[],
) {
  const { error } = await supabase.from("saved_results").insert({
    user_id: userId,
    category,
    answers: answers as unknown as never,
    results: results as unknown as never,
  });
  if (error) throw error;
  await upsertProfile(userId, profileFieldsFromAnswers(answers));
}

export async function listSavedResults(userId: string): Promise<SavedResultRow[]> {
  const { data, error } = await supabase
    .from("saved_results")
    .select("id, category, answers, results, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedResultRow[];
}
