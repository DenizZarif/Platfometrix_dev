import { useState } from "react";
import { BI_TOOLS, type BiTool } from "@/data/biTools";
import { CRM_TOOLS, type CrmTool } from "@/data/crmTools";
import { WAREHOUSE_TOOLS, type WarehouseTool } from "@/data/warehouseTools";
import type { CriterionResult } from "@/lib/matcher";
import type { CostEstimate } from "@/lib/costEstimate";
import type { Answers } from "@/lib/questions";
import type { Profile } from "@/lib/profileStore";
import {
  buildBiImplementationPlan,
  buildCrmImplementationPlan,
  buildWarehouseImplementationPlan,
} from "@/lib/implementationPlan";
import {
  buildBiFitProfile,
  buildCrmFitProfile,
  buildWarehouseFitProfile,
} from "@/lib/fitProfile";
import {
  buildBiMigrationEstimate,
  buildCrmMigrationEstimate,
  buildWarehouseMigrationEstimate,
} from "@/lib/migrationEstimate";

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

type ResultCategory = "bi" | "crm" | "warehouse";

function resolveTool(
  category: ResultCategory,
  resultTool: ShortlistTool,
) {
  if (category === "bi") {
    return BI_TOOLS.find((candidate) => candidate.id === resultTool.id) ?? (resultTool as BiTool);
  }
  if (category === "crm") {
    return CRM_TOOLS.find((candidate) => candidate.id === resultTool.id) ?? (resultTool as CrmTool);
  }
  return (
    WAREHOUSE_TOOLS.find((candidate) => candidate.id === resultTool.id) ??
    (resultTool as WarehouseTool)
  );
}

function buildDetails(
  category: ResultCategory,
  resultTool: ShortlistTool,
  answers: Answers,
  profile: Profile | null,
) {
  const resolvedTool = resolveTool(category, resultTool);
  const currentOf = (key: string) => {
    const raw = answers[key];
    return typeof raw === "string" && raw ? raw : undefined;
  };
  if (category === "bi") {
    const tool = resolvedTool as BiTool;
    return {
      implementationPlan: buildBiImplementationPlan(tool, answers, profile),
      fitProfile: buildBiFitProfile(tool),
      marketAdoption: tool.market_adoption,
      migrationEstimate: buildBiMigrationEstimate(
        currentOf("current_bi_tool"),
        tool,
        answers,
        profile,
      ),
    };
  }
  if (category === "crm") {
    const tool = resolvedTool as CrmTool;
    return {
      implementationPlan: buildCrmImplementationPlan(tool, answers, profile),
      fitProfile: buildCrmFitProfile(tool),
      marketAdoption: tool.market_adoption,
      migrationEstimate: buildCrmMigrationEstimate(
        currentOf("current_crm_tool"),
        tool,
        answers,
        profile,
      ),
    };
  }
  const tool = resolvedTool as WarehouseTool;
  return {
    implementationPlan: buildWarehouseImplementationPlan(tool, answers, profile),
    fitProfile: buildWarehouseFitProfile(tool),
    marketAdoption: tool.market_adoption,
    migrationEstimate: buildWarehouseMigrationEstimate(
      currentOf("current_warehouse_tool"),
      tool,
      answers,
      profile,
    ),
  };
}

export function ResultCard({
  result,
  rank,
  category,
  answers = {},
  profile = null,
}: {
  result: ShortlistResult;
  rank: number;
  category: ResultCategory;
  answers?: Answers;
  profile?: Profile | null;
}) {
  const [open, setOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [implementationOpen, setImplementationOpen] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);
  const { tool, finalScore, criteria, fits, caveat, costEstimate } = result;
  const isFree = costEstimate?.pricingModelLabel === "Free / open-source";
  const { implementationPlan, fitProfile, marketAdoption } = buildDetails(
    category,
    tool,
    answers,
    profile,
  );

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
        <button
          onClick={() => setImplementationOpen(!implementationOpen)}
          className="text-xs font-medium uppercase tracking-wider text-accent"
        >
          {implementationOpen ? "Hide implementation plan" : "Show implementation plan"}
        </button>
        <button
          onClick={() => setFitOpen(!fitOpen)}
          className="text-xs font-medium uppercase tracking-wider text-accent"
        >
          {fitOpen
            ? "Hide best-fit profile & popularity"
            : "Show best-fit profile & popularity"}
        </button>
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

      {implementationOpen && (
        <div className="mt-4 space-y-5 border-t border-border/60 pt-4 text-sm">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display font-semibold">Implementation &amp; feasibility</h3>
              <span className="badge">{implementationPlan.feasibility.label}</span>
            </div>
            <p className="mt-2 text-muted-foreground">{implementationPlan.feasibility.rationale}</p>
          </div>

          <div>
            <h3 className="font-display font-semibold">Integrates with</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {implementationPlan.integration.summary}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
              {implementationPlan.integration.touchpoints.map((touchpoint) => (
                <li key={touchpoint}>{touchpoint}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold">Suggested rollout</h3>
            <ol className="mt-3 space-y-3">
              {implementationPlan.actionPlan.map((phase, index) => (
                <li key={phase.phase} className="grid grid-cols-[1.5rem_1fr] gap-2">
                  <span className="font-display text-sm font-semibold text-accent">{index + 1}</span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{phase.phase}</span>
                      <span className="text-xs text-muted-foreground">{phase.duration}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{phase.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {fitOpen && (
        <div className="mt-4 space-y-5 border-t border-border/60 pt-4 text-sm">
          <div>
            <h3 className="font-display font-semibold">Popularity</h3>
            <span className="badge mt-2 inline-flex">{marketAdoption.tier}</span>
            <p className="mt-2 text-xs text-muted-foreground">{marketAdoption.note}</p>
          </div>
          <div>
            <h3 className="font-display font-semibold">Best fit for</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
              {fitProfile.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
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
