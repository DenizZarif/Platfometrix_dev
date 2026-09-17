import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { STEPS, QUESTIONS, type Answers, type Question } from "@/lib/questions";
import { CRM_STEPS, CRM_QUESTIONS } from "@/lib/questionsCrm";
import { matchTools, type CriterionResult } from "@/lib/matcher";
import { matchCrmTools } from "@/lib/matcherCrm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Platfometrix — Find the BI or CRM Tool That Fits Your Team" },
      {
        name: "description",
        content:
          "Answer a few questions about budget, team and setup and get a ranked, explained shortlist of BI/reporting or CRM tools.",
      },
      { property: "og:title", content: "Platfometrix — BI & CRM Tool Matcher" },
      {
        property: "og:description",
        content:
          "A personalized, transparent BI and CRM tool shortlist based on your budget, team skills and the way you work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Screen = "category" | "landing" | "quiz" | "results";
type Category = "bi" | "crm";

interface ShortlistTool {
  id: string;
  name: string;
  free_tier: boolean;
}

interface ShortlistResult {
  tool: ShortlistTool;
  finalScore: number;
  criteria: CriterionResult[];
  fits: string[];
  caveat: string | null;
}

const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    tagline: string;
    steps: Question[][];
    questions: Question[];
    toolCount: number;
    headline: React.ReactNode;
    blurb: string;
    headerNote: string;
  }
> = {
  bi: {
    label: "BI & Reporting",
    tagline: "Dashboards, analytics and reporting for your data.",
    steps: STEPS,
    questions: QUESTIONS,
    toolCount: 15,
    headline: (
      <>
        Find the BI tool that <span className="text-accent">actually fits</span> your team
      </>
    ),
    blurb:
      "This isn't another \"best BI tools\" list — it's a personalized match scored against your budget, your team's skills and the way your data is actually set up.",
    headerNote: "BI / reporting tool matcher",
  },
  crm: {
    label: "CRM",
    tagline: "Pipeline, contacts and sales workflow for your team.",
    steps: CRM_STEPS,
    questions: CRM_QUESTIONS,
    toolCount: 15,
    headline: (
      <>
        Find the CRM that <span className="text-accent">actually fits</span> your team
      </>
    ),
    blurb:
      "This isn't another \"best CRM\" list — it's a personalized match scored against your budget, how your team sells and how much set-up you're willing to do.",
    headerNote: "CRM tool matcher",
  },
};

function Index() {
  const [screen, setScreen] = useState<Screen>("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const config = category ? CATEGORY_CONFIG[category] : null;

  const results = useMemo<ShortlistResult[]>(() => {
    if (screen !== "results" || !category) return [];
    return category === "bi" ? matchTools(answers) : matchCrmTools(answers);
  }, [screen, answers, category]);

  const restart = () => {
    setAnswers({});
    setStep(0);
    setCategory(null);
    setScreen("category");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <button onClick={restart} className="font-display text-sm font-bold tracking-[0.2em] uppercase text-accent">
          Platfometrix
        </button>
        <span className="text-xs text-muted-foreground">
          {config ? config.headerNote : "Software tool matcher"}
        </span>
      </header>

      {screen === "category" && (
        <CategoryPicker
          onPick={(c) => {
            setCategory(c);
            setAnswers({});
            setStep(0);
            setScreen("landing");
          }}
        />
      )}
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
      {screen === "results" && <Results results={results} onRestart={restart} />}
    </main>
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

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
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
    <section className="mx-auto max-w-2xl px-6 pb-24">
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

function Results({ results, onRestart }: { results: ShortlistResult[]; onRestart: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24">
      <h1 className="font-display text-4xl font-bold tracking-tight">Your shortlist</h1>
      <p className="mt-3 text-muted-foreground">
        Ranked against your answers. Open any card to see exactly how the score was built.
      </p>

      <div className="mt-10 space-y-4">
        {results.map((r, i) => (
          <ResultCard key={r.tool.id} result={r} rank={i + 1} />
        ))}
      </div>

      <button onClick={onRestart} className="btn-ghost mt-10">
        Start over
      </button>
    </section>
  );
}

function ResultCard({ result, rank }: { result: ShortlistResult; rank: number }) {
  const [open, setOpen] = useState(false);
  const { tool, finalScore, criteria, fits, caveat } = result;

  return (
    <article className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>
            <h2 className="font-display text-xl font-semibold">{tool.name}</h2>
            {tool.free_tier && <span className="badge">Free tier</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-3xl font-bold text-accent">{finalScore}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">match</div>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {fits.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-accent">+</span>
            <span>{f}</span>
          </li>
        ))}
        {caveat && (
          <li className="flex gap-2 text-muted-foreground">
            <span>!</span>
            <span>{caveat}</span>
          </li>
        )}
      </ul>

      <button onClick={() => setOpen(!open)} className="mt-5 text-xs font-medium uppercase tracking-wider text-accent">
        {open ? "Hide score breakdown" : "Show score breakdown"}
      </button>

      {open && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Criterion</th>
                <th className="py-2 pr-3 font-medium">Your answer</th>
                <th className="py-2 pr-3 font-medium">{tool.name}</th>
                <th className="py-2 pr-3 font-medium">Weight</th>
                <th className="py-2 font-medium">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.key} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 font-medium">{c.label}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{c.answer}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{c.toolValue}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{Math.round(c.weight * 100)}%</td>
                  <td className="py-2">{Math.round(c.contribution * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
