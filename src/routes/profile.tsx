import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { ResultCard } from "@/components/ResultCard";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProfile,
  listSavedResults,
  upsertProfile,
  type Profile,
  type SavedResultRow,
} from "@/lib/profileStore";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Profile — Platfometrix" },
      {
        name: "description",
        content:
          "Your saved buying profile and every BI or CRM shortlist you've saved, with the full score breakdown.",
      },
      { property: "og:title", content: "My Profile — Platfometrix" },
      {
        property: "og:description",
        content: "Review your saved answers and past BI and CRM tool shortlists.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const FIELD_IDS = [
  "company_size",
  "budget_range",
  "technical_maturity",
  "compliance_needs",
  "customization_preference",
] as const;

function question(id: string) {
  return QUESTIONS.find((q) => q.id === id)!;
}

function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rows, setRows] = useState<SavedResultRow[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id)
      .then(setProfile)
      .catch(() => setProfile(null));
    listSavedResults(user.id)
      .then(setRows)
      .catch(() => setRows([]));
  }, [user]);

  if (loading) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Log in to see your profile</h1>
          <p className="mt-3 text-muted-foreground">
            Your saved answers and shortlists live behind your account.
          </p>
        </section>
        <AuthModal open onClose={() => {}} />
      </main>
    );
  }

  const value = (id: string): string | string[] => {
    if (!profile) return id === "compliance_needs" ? [] : "";
    if (id === "compliance_needs") return profile.compliance_needs ?? [];
    return (profile[id as "company_size"] as string | null) ?? "";
  };

  const setValue = (id: string, v: string | string[]) => {
    setProfile({ ...(profile ?? ({ id: user.id } as Profile)), [id]: v } as Profile);
    setStatus("idle");
  };

  const toggle = (id: string, option: string, multi: boolean) => {
    if (!multi) {
      setValue(id, option);
      return;
    }
    const current = (value(id) as string[]) ?? [];
    const exclusive = option === "None required" || option === "Not sure";
    let next: string[];
    if (exclusive) {
      next = current.includes(option) ? [] : [option];
    } else {
      const cleaned = current.filter((o) => o !== "None required" && o !== "Not sure");
      next = cleaned.includes(option)
        ? cleaned.filter((o) => o !== option)
        : [...cleaned, option];
    }
    setValue(id, next);
  };

  const save = async () => {
    setStatus("saving");
    try {
      await upsertProfile(user.id, {
        company_size: (value("company_size") as string) || null,
        budget_range: (value("budget_range") as string) || null,
        technical_maturity: (value("technical_maturity") as string) || null,
        compliance_needs: (value("compliance_needs") as string[]) ?? [],
        customization_preference: (value("customization_preference") as string) || null,
      });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">My profile</h1>

        <CompanyDetails userId={user.id} profile={profile} />

        <h2 className="font-display mt-20 text-2xl font-bold tracking-tight">
          Matching preferences
        </h2>
        <p className="mt-3 text-muted-foreground">
          These answers are reused whenever you start a new match, in any category.
        </p>

        <div className="mt-10 space-y-10">
          {FIELD_IDS.map((id) => {
            const q = question(id);
            const v = value(id);
            return (
              <div key={id}>
                <h2 className="font-display text-xl font-semibold">{q.label}</h2>
                {q.help && <p className="mt-1 text-sm text-muted-foreground">{q.help}</p>}
                <div className="mt-4 grid gap-2">
                  {q.options.map((opt) => {
                    const selected = Array.isArray(v) ? v.includes(opt) : v === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => toggle(id, opt, q.type === "multi")}
                        className={cn("option", selected && "option-selected")}
                      >
                        <span className={cn("option-mark", q.type === "multi" && "rounded-[4px]")} />
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button onClick={() => void save()} disabled={status === "saving"} className="btn-accent disabled:opacity-40">
            {status === "saving" ? "Saving…" : "Save profile"}
          </button>
          {status === "saved" && <span className="text-sm text-accent">Profile saved</span>}
          {status === "error" && (
            <span className="text-sm text-destructive">Couldn't save — please try again.</span>
          )}
        </div>

        <h2 className="font-display mt-20 text-2xl font-bold tracking-tight">Saved shortlists</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            You haven't saved a shortlist yet. Run a match and hit “Save this result”.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map((row) => {
              const top = row.results[0];
              const open = expanded === row.id;
              return (
                <div key={row.id} className="rounded-2xl border border-border bg-card p-5">
                  <button
                    onClick={() => setExpanded(open ? null : row.id)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="badge">{row.category.toUpperCase()}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-display font-semibold">{top?.tool.name ?? "—"}</span>
                    </div>
                    <span className="font-display text-xl font-bold text-accent">
                      {top?.finalScore ?? ""}
                    </span>
                  </button>

                  {open && (
                    <div className="mt-5 space-y-4">
                      {row.results.map((r, i) => (
                        <ResultCard key={r.tool.id} result={r} rank={i + 1} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <Link to="/" className="font-display text-sm font-bold tracking-[0.2em] uppercase text-accent">
        Platfometrix
      </Link>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <Link to="/" className="text-accent">
          New match
        </Link>
        <button
          onClick={() => {
            void supabase.auth.signOut();
          }}
          className="hover:text-foreground"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
