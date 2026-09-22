import { BI_TOOLS, type BiTool } from "@/data/biTools";
import { CRM_TOOLS, type CrmTool } from "@/data/crmTools";
import { WAREHOUSE_TOOLS, type WarehouseTool } from "@/data/warehouseTools";
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
import type { ShortlistResult, ShortlistTool } from "@/components/ResultCard";

type ResultCategory = "bi" | "crm" | "warehouse";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function planFor(
  category: ResultCategory,
  resultTool: ShortlistTool,
  answers: Answers,
  profile: Profile | null,
) {
  if (category === "bi") {
    const tool = BI_TOOLS.find((c) => c.id === resultTool.id) ?? (resultTool as BiTool);
    return buildBiImplementationPlan(tool, answers, profile);
  }
  if (category === "crm") {
    const tool = CRM_TOOLS.find((c) => c.id === resultTool.id) ?? (resultTool as CrmTool);
    return buildCrmImplementationPlan(tool, answers, profile);
  }
  const tool =
    WAREHOUSE_TOOLS.find((c) => c.id === resultTool.id) ?? (resultTool as WarehouseTool);
  return buildWarehouseImplementationPlan(tool, answers, profile);
}

function detailsFor(category: ResultCategory, resultTool: ShortlistTool) {
  if (category === "bi") {
    const tool = BI_TOOLS.find((candidate) => candidate.id === resultTool.id) ?? (resultTool as BiTool);
    return { marketAdoption: tool.market_adoption, fitProfile: buildBiFitProfile(tool) };
  }
  if (category === "crm") {
    const tool = CRM_TOOLS.find((candidate) => candidate.id === resultTool.id) ?? (resultTool as CrmTool);
    return { marketAdoption: tool.market_adoption, fitProfile: buildCrmFitProfile(tool) };
  }
  const tool =
    WAREHOUSE_TOOLS.find((candidate) => candidate.id === resultTool.id) ??
    (resultTool as WarehouseTool);
  return { marketAdoption: tool.market_adoption, fitProfile: buildWarehouseFitProfile(tool) };
}

function costLabel(result: ShortlistResult) {
  const cost = result.costEstimate;
  if (!cost) return "—";
  if (cost.pricingModelLabel === "Free / open-source") return "Free";
  return `${money(cost.monthlyLow)}–${money(cost.monthlyHigh)}/mo`;
}

export function CompareView({
  results,
  category,
  answers = {},
  profile = null,
  onClose,
}: {
  results: ShortlistResult[];
  category: ResultCategory;
  answers?: Answers;
  profile?: Profile | null;
  onClose?: () => void;
}) {
  const plans = results.map((r) => planFor(category, r.tool, answers, profile));
  const details = results.map((result) => detailsFor(category, result.tool));

  // Union of criterion labels, in first-seen order.
  const rows: { key: string; label: string }[] = [];
  results.forEach((r) =>
    r.criteria.forEach((c) => {
      if (!rows.some((row) => row.key === c.key)) rows.push({ key: c.key, label: c.label });
    }),
  );

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Side-by-side comparison</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-medium uppercase tracking-wider text-accent"
          >
            Close compare
          </button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">&nbsp;</th>
              {results.map((r) => (
                <th key={r.tool.id} className="py-2 pr-3 font-medium text-foreground">
                  {r.tool.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium">Match score</td>
              {results.map((r) => (
                <td key={r.tool.id} className="py-2 pr-3 font-display font-semibold text-accent">
                  {r.finalScore}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium">Feasibility</td>
              {results.map((r, i) => (
                <td key={r.tool.id} className="py-2 pr-3 text-muted-foreground">
                  {plans[i]?.feasibility.label ?? "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium">Estimated cost</td>
              {results.map((r) => (
                <td key={r.tool.id} className="py-2 pr-3 text-muted-foreground">
                  {costLabel(r)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium">Popularity</td>
              {details.map((detail, index) => (
                <td key={results[index]?.tool.id} className="py-2 pr-3">
                  <span className="block font-semibold text-foreground">
                    {detail.marketAdoption.tier}
                  </span>
                  <span className="mt-1 block text-muted-foreground">
                    {detail.marketAdoption.note}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium">Best fit for</td>
              {details.map((detail, index) => (
                <td key={results[index]?.tool.id} className="py-2 pr-3 text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    {detail.fitProfile.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border/50 align-top">
                <td className="py-2 pr-3 font-medium">{row.label}</td>
                {results.map((r) => {
                  const c = r.criteria.find((x) => x.key === row.key);
                  return (
                    <td key={r.tool.id} className="py-2 pr-3 text-muted-foreground">
                      {c ? (
                        <>
                          <span className="block text-foreground">{c.toolValue}</span>
                          <span>{Math.round(c.score * 100)}/100</span>
                        </>
                      ) : (
                        "Not scored"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
