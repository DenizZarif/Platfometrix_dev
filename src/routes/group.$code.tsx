import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ResultCard } from "@/components/ResultCard";
import { Quiz } from "@/routes/match";
import { CATEGORY_CONFIG, MATCHERS } from "@/lib/categories";
import type { Answers } from "@/lib/questions";
import {
  fetchGroupSession,
  listGroupSubmissions,
  submitGroupAnswer,
  type GroupSession,
  type GroupSubmission,
} from "@/lib/groupSession";

export const Route = createFileRoute("/group/$code")({
  head: () => ({
    meta: [
      { title: "Group evaluation — Platfometrix" },
      { name: "description", content: "Answer the same questions as your team and compare shortlists side by side." },
      { property: "og:title", content: "Group evaluation — Platfometrix" },
      { property: "og:description", content: "Answer the same questions as your team and compare shortlists side by side." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GroupPage,
});

function GroupPage() {
  const { code } = Route.useParams();
  const [session, setSession] = useState<GroupSession | null | undefined>(undefined);
  const [subs, setSubs] = useState<GroupSubmission[]>([]);
  const [screen, setScreen] = useState<"join" | "quiz" | "compare">("join");
  const [name, setName] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (id: string) => setSubs(await listGroupSubmissions(id)), []);

  useEffect(() => {
    fetchGroupSession(code)
      .then((s) => {
        setSession(s);
        if (s) void refresh(s.id);
      })
      .catch(() => setSession(null));
  }, [code, refresh]);

  if (session === undefined) {
    return <AppShell><p className="px-6 pt-12 text-muted-foreground">Loading…</p></AppShell>;
  }
  if (session === null) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-6 pt-12">
          <h1 className="font-display text-2xl font-bold">This link isn't valid</h1>
          <Link to="/" className="mt-4 inline-block text-accent underline">Back to dashboard</Link>
        </section>
      </AppShell>
    );
  }

  const config = CATEGORY_CONFIG[session.category];

  const finish = async () => {
    const results = MATCHERS[session.category](answers);
    try {
      await submitGroupAnswer(session.id, name.trim(), answers, results);
      await refresh(session.id);
      setError(null);
      setScreen("compare");
    } catch {
      setError("Couldn't submit your answers — please try again.");
    }
  };

  return (
    <AppShell>
      {screen === "join" && (
        <section className="mx-auto max-w-2xl px-6 pt-12 pb-24">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            You've been invited to help evaluate {config.label} tools
          </h1>
          {session.label && <p className="mt-2 text-muted-foreground">{session.label}</p>}
          <p className="mt-4 text-sm text-muted-foreground">
            {subs.length} {subs.length === 1 ? "person has" : "people have"} answered so far.
          </p>
          <div className="mt-6 flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button onClick={() => setScreen("quiz")} disabled={!name.trim()} className="btn-accent disabled:opacity-40">
              Start
            </button>
          </div>
          {subs.length > 0 && (
            <button onClick={() => setScreen("compare")} className="btn-ghost mt-4">
              See results so far
            </button>
          )}
        </section>
      )}
      {screen === "quiz" && (
        <>
          <Quiz
            steps={config.steps}
            questions={config.questions}
            step={step}
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => (step === 0 ? setScreen("join") : setStep(step - 1))}
            onNext={() => (step === config.steps.length - 1 ? void finish() : setStep(step + 1))}
          />
          {error && <p className="px-6 pb-12 text-center text-sm text-destructive">{error}</p>}
        </>
      )}
      {screen === "compare" && (
        <section className="mx-auto max-w-5xl px-6 pt-12 pb-24">
          <h1 className="font-display text-3xl font-bold tracking-tight">Team results side by side</h1>
          <p className="mt-2 text-muted-foreground">
            {config.label}{session.label ? ` · ${session.label}` : ""} — each person's own shortlist.
          </p>
          <div className="mt-8 space-y-6">
            {subs.map((s) => <ParticipantCard key={s.id} sub={s} session={session} />)}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function ParticipantCard({ sub, session }: { sub: GroupSubmission; session: GroupSession }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl font-semibold">{sub.participant_name}</h2>
        <span className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleDateString()}</span>
      </div>
      <ol className="mt-4 space-y-1 text-sm">
        {sub.results.slice(0, 3).map((r, i) => (
          <li key={r.tool.id} className="flex justify-between">
            <span>{i + 1}. {r.tool.name}</span>
            <span className="text-muted-foreground">{Math.round(r.finalScore)}</span>
          </li>
        ))}
      </ol>
      <button onClick={() => setOpen(!open)} className="btn-ghost mt-4">
        {open ? "Hide full shortlist" : "View full shortlist"}
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {sub.results.map((r, i) => (
            <ResultCard key={r.tool.id} result={r} rank={i + 1} category={session.category} answers={sub.answers} profile={null} />
          ))}
        </div>
      )}
    </div>
  );
}
