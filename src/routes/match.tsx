import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Answers, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { ResultCard, type ShortlistResult } from "@/components/ResultCard";
import { AuthModal } from "@/components/AuthModal";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { answersFromProfile, fetchProfile, saveResult, type Profile } from "@/lib/profileStore";
import { CATEGORY_CONFIG, MATCHERS, isCategory, type Category } from "@/lib/categories";

export const Route = createFileRoute("/match")({
  validateSearch: (search: Record<string, unknown>): { category?: Category } => {
    return isCategory(search["category"]) ? { category: search["category"] } : {};
  },
  head: () => ({
    meta: [
      { title: "New Match — Platfometrix" },
      {
        name: "description",
        content:
          "Answer a few questions about budget, team and setup and get a ranked, explained shortlist of BI, CRM or data warehouse tools.",
      },
      { property: "og:title", content: "New Match — Platfometrix" },
      {
        property: "og:description",
        content:
          "A personalized, transparent software shortlist based on your budget, team skills and the way you work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchPage,
});

type Screen = "category" | "landing" | "quiz" | "results";

function MatchPage() {
  const { category: initialCategory } = Route.useSearch();

  const [screen, setScreen] = useState<Screen>(initialCategory ? "landing" : "category");
  const [category, setCategory] = useState<Category | null>(initialCategory ?? null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const pendingSave = useRef(false);
  const prefilled = useRef(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchProfile(user.id)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user]);

  // When arriving with ?category=..., prefill shared answers once the profile loads.
  useEffect(() => {
    if (!initialCategory || prefilled.current || !profile) return;
    prefilled.current = true;
    setAnswers((a) => ({ ...answersFromProfile(profile), ...a }));
  }, [initialCategory, profile]);

  const config = category ? CATEGORY_CONFIG[category] : null;

  const results = useMemo<ShortlistResult[]>(() => {
    if (screen !== "results" || !category) return [];
    return MATCHERS[category](answers);
  }, [screen, answers, category]);

  const doSave = useCallback(async () => {
    if (!user || !category) return;
    setSaveState("saving");
    try {
      await saveResult(user.id, category, answers, results);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [user, category, answers, results]);

  useEffect(() => {
    if (user && pendingSave.current && results.length > 0) {
      pendingSave.current = false;
      void doSave();
    }
  }, [user, results, doSave]);

  const onSaveClick = () => {
    if (!user) {
      pendingSave.current = true;
      setAuthOpen(true);
      return;
    }
    void doSave();
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setCategory(null);
    setSaveState("idle");
    setScreen("category");
  };

  const pickCategory = (c: Category) => {
    setCategory(c);
    setAnswers(answersFromProfile(profile));
    setStep(0);
    setSaveState("idle");
    setScreen("landing");
  };

  return (
    <AppShell>
      {screen === "category" && <CategoryPicker onPick={pickCategory} />}
      {screen === "landing" && config && (
        <Landing config={config} onStart={() => setScreen("quiz")} />
      )}
      {screen === "quiz" && config && (
        <Quiz
          steps={config.steps}
          questions={config.questions}
          step={step}
          answers={answers}
          setAnswers={setAnswers}
          onBack={() => (step === 0 ? setScreen("landing") : setStep(step - 1))}
          onNext={() =>
            step === config.steps.length - 1 ? setScreen("results") : setStep(step + 1)
          }
        />
      )}
      {screen === "results" && (
        <Results
          results={results}
          category={category}
          answers={answers}
          profile={profile}
          onRestart={restart}
          onSave={onSaveClick}
          saveState={saveState}
        />
      )}

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          pendingSave.current = false;
        }}
        onAuthed={() => setAuthOpen(false)}
      />
    </AppShell>
  );
}

function CategoryPicker({ onPick }: { onPick: (c: Category) => void }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-20 pb-28 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">Pick a category</p>
      <h1 className="font-display mt-6 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
        What are you <span className="text-accent">shopping for</span>?
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        Each category is scored on its own set of questions — answer once and get a ranked,
        explained shortlist.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(CATEGORY_CONFIG) as Category[]).map((c) => {
          const cfg = CATEGORY_CONFIG[c];
          return (
            <button
              key={c}
              onClick={() => onPick(c)}
              className="rounded-2xl border border-border bg-card p-8 text-left transition-colors hover:border-accent"
            >
              <h2 className="font-display text-2xl font-semibold">{cfg.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{cfg.tagline}</p>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-accent">
                {cfg.toolCount} tools · {cfg.questions.length} questions
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Landing({
  config,
  onStart,
}: {
  config: (typeof CATEGORY_CONFIG)[Category];
  onStart: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-20 pb-28 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
        {config.toolCount} tools · {config.questions.length} questions · 2 minutes
      </p>
      <h1 className="font-display mt-6 text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
        {config.headline}
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{config.blurb}</p>
      <button onClick={onStart} className="btn-accent mt-10">
        Find my match
      </button>
    </section>
  );
}

function Quiz({
  steps,
  questions: allQuestions,
  step,
  answers,
  setAnswers,
  onBack,
  onNext,
}: {
  steps: Question[][];
  questions: Question[];
  step: number;
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const questions = steps[step] ?? [];
  const answered = questions.every((q) => {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });
  const progress = ((step + 1) / steps.length) * 100;
  const answeredCount = allQuestions.filter((q) => {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;

  const toggle = (qid: string, option: string, multi: boolean) => {
    if (!multi) {
      setAnswers({ ...answers, [qid]: option });
      return;
    }
    const current = (answers[qid] as string[]) ?? [];
    const exclusive = option === "None required" || option === "Not sure";
    let next: string[];
    if (exclusive) {
      next = current.includes(option) ? [] : [option];
    } else {
      next = current
        .filter((o) => o !== "None required" && o !== "Not sure")
        .includes(option)
        ? current.filter((o) => o !== option)
        : [...current.filter((o) => o !== "None required" && o !== "Not sure"), option];
    }
    setAnswers({ ...answers, [qid]: next });
  };

  return (
    <section className="mx-auto max-w-2xl px-6 pt-12 pb-24">
      <div className="mb-10">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{answeredCount}/{allQuestions.length} answered</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-10">
        {questions.map((q) => {
          const value = answers[q.id];
          return (
            <div key={q.id}>
              <h2 className="font-display text-xl font-semibold">{q.label}</h2>
              {q.help && <p className="mt-1 text-sm text-muted-foreground">{q.help}</p>}
              <div className="mt-4 grid gap-2">
                {q.options.map((opt) => {
                  const selected = Array.isArray(value) ? value.includes(opt) : value === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(q.id, opt, q.type === "multi")}
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

      <div className="mt-12 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button onClick={onNext} disabled={!answered} className="btn-accent disabled:cursor-not-allowed disabled:opacity-40">
          {step === steps.length - 1 ? "See my matches" : "Continue"}
        </button>
      </div>
    </section>
  );
}

function Results({
  results,
  category,
  answers,
  profile,
  onRestart,
  onSave,
  saveState,
}: {
  results: ShortlistResult[];
  category: Category | null;
  answers: Answers;
  profile: Profile | null;
  onRestart: () => void;
  onSave: () => void;
  saveState: "idle" | "saving" | "saved" | "error";
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-12 pb-24">
      <h1 className="font-display text-4xl font-bold tracking-tight">Your shortlist</h1>
      <p className="mt-3 text-muted-foreground">
        Ranked against your answers. Open any card to see exactly how the score was built.
      </p>

      <div className="mt-10 space-y-4">
        {results.map((r, i) => (
          category && (
            <ResultCard
              key={r.tool.id}
              result={r}
              rank={i + 1}
              category={category}
              answers={answers}
              profile={profile}
            />
          )
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button onClick={onRestart} className="btn-ghost">
          Start over
        </button>
        <button onClick={onSave} disabled={saveState === "saving"} className="btn-accent disabled:opacity-40">
          {saveState === "saving" ? "Saving…" : "Save this result"}
        </button>
        {saveState === "saved" && <span className="text-sm text-accent">Saved to your profile</span>}
        {saveState === "error" && (
          <span className="text-sm text-destructive">Couldn't save — please try again.</span>
        )}
      </div>
    </section>
  );
}
