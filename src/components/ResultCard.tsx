import { useState } from "react";
import type { CriterionResult } from "@/lib/matcher";
import type { CostEstimate } from "@/lib/costEstimate";

export interface ShortlistTool {
  id: string;
  name: string;
  free_tier: boolean;
}

export interface ShortlistResult {
  tool: ShortlistTool;
  finalScore: number;
  criteria: CriterionResult[];
  fits: string[];
  caveat: string | null;
  costEstimate?: CostEstimate;
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function ResultCard({ result, rank }: { result: ShortlistResult; rank: number }) {
  const [open, setOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const { tool, finalScore, criteria, fits, caveat, costEstimate } = result;
  const isFree = costEstimate?.pricingModelLabel === "Free / open-source";

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

      {costEstimate && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-semibold">
              {isFree ? "Free" : `${money(costEstimate.monthlyLow)}–${money(costEstimate.monthlyHigh)}/mo`}
            </span>
            {costEstimate.freeTierNote && <span className="badge">{costEstimate.freeTierNote}</span>}
          </div>
          <div className="text-xs text-muted-foreground">estimated</div>
          <div className="mt-1 text-xs text-muted-foreground">{costEstimate.assumptionNote}</div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-5">
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-medium uppercase tracking-wider text-accent"
        >
          {open ? "Hide score breakdown" : "Show score breakdown"}
        </button>
        {costEstimate && (
          <button
            onClick={() => setCostOpen(!costOpen)}
            className="text-xs font-medium uppercase tracking-wider text-accent"
          >
            {costOpen ? "Hide cost breakdown" : "Show cost breakdown"}
          </button>
        )}
      </div>

      {costOpen && costEstimate && (
        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Pricing model</dt>
            <dd>{costEstimate.pricingModelLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cost tier</dt>
            <dd>{costEstimate.costTierLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Estimated monthly</dt>
            <dd>
              {isFree ? "Free" : `${money(costEstimate.monthlyLow)}–${money(costEstimate.monthlyHigh)}`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Estimated annual</dt>
            <dd>
              {isFree
                ? "Free"
                : `${money(costEstimate.monthlyLow * 12)}–${money(costEstimate.monthlyHigh * 12)}`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Implementation effort</dt>
            <dd className="capitalize">{costEstimate.implementationCostTier}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time to value</dt>
            <dd className="capitalize">{costEstimate.timeToValue}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Hidden costs</dt>
            <dd>
              {costEstimate.hiddenCosts.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {costEstimate.hiddenCosts.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : (
                "No notable hidden costs reported"
              )}
            </dd>
          </div>
        </dl>
      )}


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
