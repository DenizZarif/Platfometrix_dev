import { supabase } from "@/integrations/supabase/client";
import type { Answers } from "./questions";
import type { ShortlistResult } from "@/components/ResultCard";
import type { Category } from "./categories";

export interface GroupSession {
  id: string;
  code: string;
  category: Category;
  label: string | null;
  created_at: string;
}

export interface GroupSubmission {
  id: string;
  participant_name: string;
  answers: Answers;
  results: ShortlistResult[];
  submitted_at: string;
}

function generateCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function createGroupSession(
  category: Category,
  label: string | null,
  createdBy: string | null,
): Promise<GroupSession> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("group_sessions")
      .insert({ code, category, label, created_by: createdBy })
      .select("id, code, category, label, created_at")
      .single();
    if (!error) return data as unknown as GroupSession;
    if (!/duplicate key/i.test(error.message)) throw error;
  }
  throw new Error("Could not generate a unique code, please try again.");
}

export async function fetchGroupSession(code: string): Promise<GroupSession | null> {
  const { data, error } = await supabase
    .from("group_sessions")
    .select("id, code, category, label, created_at")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as GroupSession | null;
}

export async function submitGroupAnswer(
  sessionId: string,
  participantName: string,
  answers: Answers,
  results: ShortlistResult[],
): Promise<void> {
  const { error } = await supabase.from("group_submissions").insert({
    session_id: sessionId,
    participant_name: participantName,
    answers: answers as unknown as never,
    results: results as unknown as never,
  });
  if (error) throw error;
}

export async function listGroupSubmissions(sessionId: string): Promise<GroupSubmission[]> {
  const { data, error } = await supabase
    .from("group_submissions")
    .select("id, participant_name, answers, results, submitted_at")
    .eq("session_id", sessionId)
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as GroupSubmission[];
}
