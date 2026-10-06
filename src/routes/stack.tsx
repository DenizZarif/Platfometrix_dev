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
import type { ErpTool } from "@/data/erpTools";
import { buildErpImplementationPlan } from "@/lib/erpDetails";
import { fetchProfile, type Profile } from "@/lib/profileStore";
import { cn } from "@/lib/utils";
import {
  buildBiImplementationPlan,
  buildCrmImplementationPlan,
  buildWarehouseImplementationPlan,
} from "@/lib/implementationPlan";
import {
  addChecklistItem,
  bulkAddStackItems,
  type BulkStackRow,
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

const CATEGORY_LABEL: Record<Category, string> = { bi: "BI", crm: "CRM", warehouse: "Data Warehouse", erp: "ERP" };

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
  const [itemType, setItemType] = useState<"tool" | "data_source">("tool");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StackItem["stage"] | "all">("all");

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
      await addManualStackItem(user.id, name.trim(), (cat || null) as Category | null, itemType);
      setName("");
      setCat("");
      setItemType("tool");
      reload();
    } catch {
      setError("Couldn't add that tool — please try again.");
    }
  };

  const visible = filter === "all" ? items : items.filter((i) => i.stage === filter);

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
              <option value="erp">ERP</option>
            </select>
            <select
              aria-label="Type"
              className={inputClass}
              value={itemType}
              onChange={(e) => setItemType(e.target.value as "tool" | "data_source")}
            >
              <option value="tool">Tool / App / Software</option>
              <option value="data_source">Data source</option>
            </select>
            <button type="submit" className="btn-accent" disabled={!name.trim()}>
              Add tool
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </form>

        <BulkImport userId={user.id} onDone={reload} />

        {items.length === 0 ? (
          <p className="mt-10 text-muted-foreground">
            Nothing here yet — add a tool manually, or add one from a saved shortlist on your Profile page.
          </p>
        ) : (
          <>
            <div className="mt-10 flex flex-wrap gap-2">
              {[{ value: "all" as const, label: `All (${items.length})` }, ...STAGES].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFilter(s.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs",
                    filter === s.value
                      ? "border-accent text-accent"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">Nothing at this stage.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {visible.map((item) => (
                  <StackCard key={item.id} item={item} userId={user.id} onChange={reload} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}

const splitList = (s: string | null) =>
  (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

const STAGE_VALUES = STAGES.map((s) => s.value) as string[];

function parseCsv(text: string): { rows: BulkStackRow[]; noName: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const cells = lines.map((l) => l.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1").trim()));
  let idx = { name: 0, category: 1, type: 2, stage: 3 };
  if (cells[0]?.[0]?.toLowerCase() === "name") {
    const header = cells.shift()!.map((h) => h.toLowerCase());
    idx = {
      name: header.indexOf("name"),
      category: header.indexOf("category"),
      type: header.indexOf("type"),
      stage: header.indexOf("stage"),
    };
  }
  const get = (row: string[], i: number) => (i >= 0 ? (row[i] ?? "") : "");
  const rows: BulkStackRow[] = [];
  let noName = 0;
  for (const row of cells) {
    const name = get(row, idx.name);
    if (!name) {
      noName++;
      continue;
    }
    const c = get(row, idx.category).toLowerCase();
    const t = get(row, idx.type).toLowerCase();
    const st = get(row, idx.stage).toLowerCase();
    rows.push({
      name,
      category: c === "bi" || c === "crm" || c === "warehouse" || c === "erp" ? c : null,
      itemType: t === "data_source" ? "data_source" : "tool",
      stage: (STAGE_VALUES.includes(st) ? st : "evaluating") as StackItem["stage"],
    });
  }
  return { rows, noName };
}

function BulkImport({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProfile(userId).then(setProfile).catch(() => setProfile(null));
  }, [userId]);

  const tools = splitList(profile?.existing_stack ?? null);
  const sources = splitList(profile?.digital_assets ?? null);

  const importProfile = async () => {
    setBusy(true);
    try {
      const rows: BulkStackRow[] = [
        ...tools.map((name) => ({ name, category: null, itemType: "tool" as const, stage: "evaluating" as const })),
        ...sources.map((name) => ({ name, category: null, itemType: "data_source" as const, stage: "evaluating" as const })),
      ];
      const r = await bulkAddStackItems(userId, rows);
      setProfileMsg(`Added ${r.added}, skipped ${r.skipped} already in your stack`);
      onDone();
    } catch {
      setProfileMsg("Couldn't import — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const { rows, noName } = parseCsv(await file.text());
      const r = await bulkAddStackItems(userId, rows);
      setCsvMsg(
        `Imported ${r.added}, skipped ${r.skipped}` +
          (noName ? `. ${noName} row${noName === 1 ? " had" : "s had"} no name and ${noName === 1 ? "was" : "were"} skipped.` : ""),
      );
      onDone();
    } catch {
      setCsvMsg("Couldn't import that file — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-semibold">Import your stack in bulk</h2>
      <div className="mt-4">
        {tools.length || sources.length ? (
          <>
            <p className="text-sm text-muted-foreground">
              Found {tools.length} item{tools.length === 1 ? "" : "s"} in 'Tools you already use' and{" "}
              {sources.length} in 'Other systems or data you run'
            </p>
            <button onClick={() => void importProfile()} disabled={busy} className="btn-accent mt-3 disabled:opacity-40">
              Import from your profile
            </button>
            {profileMsg && <p className="mt-2 text-sm text-accent">{profileMsg}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add tools in 'Company details' on your Profile page to import them here
          </p>
        )}
      </div>
      <label className="mt-6 block">
        <span className="text-sm font-medium">Or upload a CSV</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Columns: name (required), category (bi/crm/warehouse/erp, optional), type (tool/data_source,
          optional), stage (optional).
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => void onFile(e)}
          className="mt-2 block text-sm text-muted-foreground"
        />
      </label>
      {csvMsg && <p className="mt-2 text-sm text-accent">{csvMsg}</p>}
    </div>
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
            <span className="text-xs text-muted-foreground">
              {item.item_type === "data_source" ? "Data source" : "Tool"}
            </span>
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
