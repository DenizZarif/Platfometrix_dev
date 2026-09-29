import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthModal } from "@/components/AuthModal";
import { resolveTool } from "@/components/ResultCard";
import { useAuth } from "@/hooks/useAuth";
import type { Category } from "@/lib/categories";
import type { BiTool } from "@/data/biTools";
import type { CrmTool } from "@/data/crmTools";
import type { WarehouseTool } from "@/data/warehouseTools";
import { fetchProfile } from "@/lib/profileStore";
import {
  buildBiImplementationPlan,
  buildCrmImplementationPlan,
  buildWarehouseImplementationPlan,
} from "@/lib/implementationPlan";
import {
  addChecklistItem,
  addManualStackItem,
  deleteChecklistItem,
  deleteStackItem,
  listChecklistItems,
  listStackItems,
  seedSetupChecklist,
  toggleChecklistItem,
  updateChecklistItemFields,
  updateStackItemStage,
  type StackChecklistItem,
  type StackItem,
} from "@/lib/stackStore";

export const Route = createFileRoute("/stack")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Stack — Platfometrix" },
      {
        name: "description",
        content: "Track the tools your company runs and how each rollout is going, step by step.",
      },
      { property: "og:title", content: "My Stack — Platfometrix" },
      {
        property: "og:description",
        content: "A private inventory of your tools with trackable setup checklists.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StackPage,
});

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

const CATEGORY_LABEL: Record<Category, string> = { bi: "BI", crm: "CRM", warehouse: "Data Warehouse" };

const STAGES: { value: StackItem["stage"]; label: string }[] = [
  { value: "evaluating", label: "Evaluating" },
  { value: "implementing", label: "Implementing" },
  { value: "live", label: "Live" },
  { value: "under_review", label: "Under review" },
  { value: "retired", label: "Retired" },
];

function StackPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<StackItem[]>([]);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!user) return;
    listStackItems(user.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [user]);

  useEffect(reload, [reload]);

  if (loading) return <AppShell>{null}</AppShell>;

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Log in to see your stack</h1>
          <p className="mt-3 text-muted-foreground">
            Your tool inventory and rollout progress live behind your account.
          </p>
        </section>
        <AuthModal open onClose={() => {}} />
      </AppShell>
    );
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await addManualStackItem(user.id, name.trim(), (cat || null) as Category | null);
      setName("");
      setCat("");
      reload();
    } catch {
      setError("Couldn't add that tool — please try again.");
    }
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">My Stack</h1>
        <p className="mt-3 text-muted-foreground">
          The tools your company actually runs, and how their rollout is going.
        </p>

        <form onSubmit={(e) => void add(e)} className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Add a tool manually</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              required
              aria-label="Tool name"
              placeholder="Tool name"
              className={`${inputClass} flex-1 min-w-48`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              aria-label="Category"
              className={inputClass}
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="">Other</option>
              <option value="bi">BI</option>
              <option value="crm">CRM</option>
              <option value="warehouse">Data Warehouse</option>
            </select>
            <button type="submit" className="btn-accent" disabled={!name.trim()}>
              Add tool
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </form>

        {items.length === 0 ? (
          <p className="mt-10 text-muted-foreground">
            Nothing here yet — add a tool manually, or add one from a saved shortlist on your Profile page.
          </p>
        ) : (
          <div className="mt-10 space-y-4">
            {items.map((item) => (
              <StackCard key={item.id} item={item} userId={user.id} onChange={reload} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function StackCard({ item, userId, onChange }: { item: StackItem; userId: string; onChange: () => void }) {
  const [stage, setStage] = useState(item.stage);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold">{item.name}</h2>
            <span className="badge">{item.category ? CATEGORY_LABEL[item.category] : "Other"}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.source === "saved_result" && item.category
              ? `From your ${CATEGORY_LABEL[item.category]} match`
              : "Added manually"}{" "}
            · {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Stage"
            className={inputClass}
            value={stage}
            onChange={(e) => {
              const next = e.target.value as StackItem["stage"];
              setStage(next);
              void updateStackItemStage(item.id, next);
            }}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {confirmRemove ? (
            <>
              <button
                className="text-xs text-destructive"
                onClick={() => void deleteStackItem(item.id).then(onChange)}
              >
                Confirm
              </button>
              <button className="text-xs text-muted-foreground" onClick={() => setConfirmRemove(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setConfirmRemove(true)}>
              Remove
            </button>
          )}
        </div>
      </div>

      <button
        className="mt-4 text-sm text-accent"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide setup checklist" : "Setup checklist"}
      </button>
      {open && <Checklist item={item} userId={userId} />}
    </div>
  );
}

function Checklist({ item, userId }: { item: StackItem; userId: string }) {
  const [rows, setRows] = useState<StackChecklistItem[] | null>(null);
  const [newStep, setNewStep] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listChecklistItems(item.id)
      .then(setRows)
      .catch(() => setRows([]));
  }, [item.id]);
  useEffect(load, [load]);

  if (!rows) return <p className="mt-4 text-sm text-muted-foreground">Loading…</p>;

  const canGenerate = !!(item.category && item.tool_id && item.answers) && rows.length === 0;

  const generate = async () => {
    if (!item.category || !item.tool_id || !item.answers) return;
    setBusy(true);
    try {
      const tool = resolveTool(item.category, { id: item.tool_id, name: item.name, free_tier: false });
      const profile = await fetchProfile(userId);
      const plan =
        item.category === "bi"
          ? buildBiImplementationPlan(tool as BiTool, item.answers, profile)
          : item.category === "crm"
            ? buildCrmImplementationPlan(tool as CrmTool, item.answers, profile)
            : buildWarehouseImplementationPlan(tool as WarehouseTool, item.answers, profile);
      await seedSetupChecklist(item.id, plan.actionPlan);
      load();
    } finally {
      setBusy(false);
    }
  };

  const addStep = async () => {
    if (!newStep.trim()) return;
    const next = rows.reduce((m, r) => Math.max(m, r.sort_order), -1) + 1;
    await addChecklistItem(item.id, newStep.trim(), next);
    setNewStep("");
    load();
  };

  const done = rows.filter((r) => r.done).length;

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
      {canGenerate && (
        <button onClick={() => void generate()} disabled={busy} className="btn-accent disabled:opacity-40">
          {busy ? "Generating…" : "Generate setup checklist"}
        </button>
      )}
      {rows.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {done}/{rows.length} done
          </p>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="flex gap-3 rounded-lg border border-border/60 p-3">
                <input
                  type="checkbox"
                  aria-label={`Mark ${r.label} done`}
                  className="mt-1"
                  checked={r.done}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setRows((rs) => rs && rs.map((x) => (x.id === r.id ? { ...x, done: v } : x)));
                    void toggleChecklistItem(r.id, v);
                  }}
                />
                <div className="flex-1">
                  <p className="font-semibold">{r.label}</p>
                  {r.detail && <p className="text-sm text-muted-foreground">{r.detail}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      placeholder="Owner"
                      aria-label="Owner"
                      className={`${inputClass} py-1 text-xs`}
                      defaultValue={r.owner ?? ""}
                      onBlur={(e) => void updateChecklistItemFields(r.id, { owner: e.target.value || null })}
                    />
                    <input
                      type="date"
                      aria-label="Target date"
                      className={`${inputClass} py-1 text-xs`}
                      defaultValue={r.target_date ?? ""}
                      onChange={(e) =>
                        void updateChecklistItemFields(r.id, { target_date: e.target.value || null })
                      }
                    />
                  </div>
                </div>
                <button
                  className="self-start text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => void deleteChecklistItem(r.id).then(load)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="flex gap-2">
        <input
          placeholder="+ Add step"
          aria-label="New step"
          className={`${inputClass} flex-1`}
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void addStep()}
        />
        <button className="btn-accent" onClick={() => void addStep()} disabled={!newStep.trim()}>
          Add step
        </button>
      </div>
    </div>
  );
}
