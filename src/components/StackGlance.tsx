import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { listStackItems, type StackItem } from "@/lib/stackStore";
import { computeStackInsights, type CategoryKey, type StageKey } from "@/lib/stackInsights";
import { cn } from "@/lib/utils";

const STAGE_LABEL: Record<StageKey, string> = {
  evaluating: "Evaluating",
  implementing: "Implementing",
  live: "Live",
  under_review: "Under review",
  retired: "Retired",
};
const CATEGORY_LABEL: Record<CategoryKey, string> = {
  bi: "BI",
  crm: "CRM",
  warehouse: "Data Warehouse",
  erp: "ERP",
  other: "Other",
};
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const money = (cur: string, n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? "" : "s"}`;

const card = "rounded-2xl border border-border bg-card p-5";

function Bars({ rows }: { rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="mt-4 space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <Link to="/stack" className="block text-sm hover:text-accent">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-display font-semibold">{r.n}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-secondary">
              <div className="h-1 rounded-full bg-accent" style={{ width: `${(r.n / max) * 100}%` }} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function StackGlance({ userId }: { userId: string }) {
  const [items, setItems] = useState<StackItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    listStackItems(userId)
      .then((r) => alive && setItems(r))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [userId]);

  if (failed) return null;

  const header = (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-display text-2xl font-bold tracking-tight">Your stack at a glance</h2>
      <Link to="/stack" className="text-sm text-accent">
        Manage my stack →
      </Link>
    </div>
  );

  if (!items) {
    return (
      <div className="mt-16">
        {header}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn(card, "h-24 animate-pulse")} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-16">
        {header}
        <div className={cn(card, "mt-6 p-8")}>
          <p className="text-muted-foreground">
            Track the tools and data sources you already use, with owners, costs and renewal dates.
          </p>
          <Link to="/stack" className="btn-accent mt-4">
            Open My Stack
          </Link>
        </div>
      </div>
    );
  }

  const s = computeStackInsights(items);
  const currencies = Object.entries(s.spend);
  const hasRenewalDates = items.some((i) => i.renewal_date);
  const attentionLines = [
    s.attention.liveMissingOwner > 0 && `${plural(s.attention.liveMissingOwner, "live item")} ${s.attention.liveMissingOwner === 1 ? "has" : "have"} no owner`,
    s.attention.liveMissingRenewal > 0 && `${plural(s.attention.liveMissingRenewal, "live item")} ${s.attention.liveMissingRenewal === 1 ? "has" : "have"} no renewal date`,
    s.attention.liveMissingCost > 0 && `${plural(s.attention.liveMissingCost, "live item")} ${s.attention.liveMissingCost === 1 ? "has" : "have"} no cost`,
  ].filter(Boolean) as string[];

  return (
    <div className="mt-16">
      {header}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total items</p>
          <p className="mt-2 font-display text-3xl font-bold">{s.totals.all}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {plural(s.totals.tools, "tool")} · {plural(s.totals.dataSources, "data source")}
          </p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Live</p>
          <p className="mt-2 font-display text-3xl font-bold">{s.byStage.live}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Evaluating / implementing</p>
          <p className="mt-2 font-display text-3xl font-bold">{s.byStage.evaluating + s.byStage.implementing}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Estimated annual spend</p>
          {currencies.length ? (
            <>
              {currencies.map(([cur, v]) => (
                <p key={cur} className="mt-2 font-display text-xl font-bold">
                  {money(cur, v.annual)} / year
                </p>
              ))}
              <p className="mt-1 text-xs text-muted-foreground">live, implementing &amp; under-review items with a cost</p>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-3xl font-bold">—</p>
              <p className="mt-1 text-xs text-muted-foreground">Add costs in My Stack to see this</p>
            </>
          )}
          {s.spendMissingCost > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {plural(s.spendMissingCost, "item")} {s.spendMissingCost === 1 ? "has" : "have"} no cost recorded
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className={card}>
          <h3 className="font-display font-semibold">By stage</h3>
          <Bars rows={(Object.keys(STAGE_LABEL) as StageKey[]).map((k) => ({ label: STAGE_LABEL[k], n: s.byStage[k] }))} />
        </div>
        <div className={card}>
          <h3 className="font-display font-semibold">By category</h3>
          <Bars
            rows={(Object.keys(CATEGORY_LABEL) as CategoryKey[])
              .filter((k) => s.byCategory[k] > 0)
              .map((k) => ({ label: CATEGORY_LABEL[k], n: s.byCategory[k] }))}
          />
        </div>
      </div>

      <div className={cn(card, "mt-3")}>
        <h3 className="font-display font-semibold">Coming up</h3>
        {s.upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No renewals or notice deadlines in the next 90 days.
            {!hasRenewalDates && " Add renewal dates to your items in My Stack to see them here."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {s.upcoming.slice(0, 5).map((e) => {
              const warn = e.kind === "passed" || e.daysAway <= 60;
              const label =
                e.kind === "renewal" ? "Renews" : e.kind === "notice" ? "Notice due" : "Renewal date passed — needs a decision";
              return (
                <li key={`${e.item.id}-${e.kind}`}>
                  <Link to="/stack" className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm hover:text-accent">
                    <span className="font-medium">{e.item.name}</span>
                    <span className={warn ? "text-warning" : "text-muted-foreground"}>
                      {label} · {fmtDate(e.date)}
                      {e.kind !== "passed" && ` · ${e.daysAway === 0 ? "today" : `in ${plural(e.daysAway, "day")}`}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {attentionLines.length > 0 && (
        <div className={cn(card, "mt-3")}>
          <h3 className="font-display font-semibold">Worth fixing</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {attentionLines.map((l) => (
              <li key={l}>
                <Link to="/stack" className="text-muted-foreground hover:text-accent">
                  {l} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
