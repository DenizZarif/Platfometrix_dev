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
  updateStackItem,
  stackItemsToCsv,
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

        <div className="mt-6 flex justify-end">
          <button
            className="btn-ghost disabled:opacity-40"
            disabled={items.length === 0}
            onClick={() => downloadCsv(items)}
          >
            Export CSV
          </button>
        </div>

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

function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const t = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (quoted) {
      if (ch === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c));
}

const EXTRA_COLS = ["owner", "cost", "cost_period", "currency", "seats", "renewal_date", "notice_days", "auto_renews", "vendor_contact", "notes"];

/** Undo the export's formula-injection guard (leading ' before = + - @ tab). */
const unguard = (v: string) => (/^'[=+\-@\t]/.test(v) ? v.slice(1) : v);
const nonNegNum = (v: string, int: boolean) => {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || (int && !Number.isInteger(n))) return null;
  return n;
};

function parseCsv(text: string): { rows: BulkStackRow[]; noName: number } {
  const cells = splitCsv(text);
  let idx: Record<string, number> = { name: 0, category: 1, type: 2, stage: 3 };
  if (cells[0]?.[0]?.toLowerCase() === "name") {
    const header = cells.shift()!.map((h) => h.toLowerCase());
    idx = {};
    for (const k of ["name", "category", "type", "stage", ...EXTRA_COLS]) idx[k] = header.indexOf(k);
  }
  const get = (row: string[], k: string) => {
    const i = idx[k] ?? -1;
    return i >= 0 ? (row[i] ?? "") : "";
  };
  const rows: BulkStackRow[] = [];
  let noName = 0;
  for (const row of cells) {
    const name = unguard(get(row, "name"));
    if (!name) {
      noName++;
      continue;
    }
    const c = get(row, "category").toLowerCase();
    const t = get(row, "type").toLowerCase();
    const st = get(row, "stage").toLowerCase();
    const r: BulkStackRow = {
      name,
      category: c === "bi" || c === "crm" || c === "warehouse" || c === "erp" ? c : null,
      itemType: t === "data_source" ? "data_source" : "tool",
      stage: (STAGE_VALUES.includes(st) ? st : "evaluating") as StackItem["stage"],
    };
    const text = (k: string) => unguard(get(row, k)) || null;
    r.owner = text("owner");
    r.vendor_contact = text("vendor_contact");
    r.notes = text("notes");
    r.cost_amount = nonNegNum(get(row, "cost"), false);
    r.seats = nonNegNum(get(row, "seats"), true);
    r.notice_days = nonNegNum(get(row, "notice_days"), true);
    const period = get(row, "cost_period").toLowerCase();
    r.cost_period = period === "monthly" || period === "annual" ? period : null;
    const cur = get(row, "currency").toUpperCase();
    if (cur === "EUR" || cur === "USD" || cur === "GBP") r.currency = cur;
    const d = get(row, "renewal_date");
    r.renewal_date = /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) ? d : null;
    const ar = get(row, "auto_renews").toLowerCase();
    r.auto_renews = ar === "yes" || ar === "true" ? true : ar === "no" || ar === "false" ? false : null;
    rows.push(r);
  }
  return { rows, noName };
}

function downloadCsv(items: StackItem[]) {
  const blob = new Blob([stackItemsToCsv(items)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-stack-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
          optional), stage (optional). A file from Export CSV can be imported back as-is.
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
  useEffect(() => setStage(item.stage), [item.stage]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

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
          <button className="text-xs text-accent" onClick={() => setEditing((e) => !e)}>
            {editing ? "Close edit" : "Edit"}
          </button>
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

      {editing ? (
        <EditPanel
          item={item}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChange();
          }}
        />
      ) : (
        <ContractSummary item={item} />
      )}

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

const DAY = 86_400_000;
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function ContractSummary({ item }: { item: StackItem }) {
  const parts: string[] = [];
  if (item.cost_amount != null) {
    const money = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: item.currency || "EUR",
      maximumFractionDigits: item.cost_amount % 1 === 0 ? 0 : 2,
    }).format(item.cost_amount);
    parts.push(item.cost_period ? `${money} / ${item.cost_period === "annual" ? "year" : "month"}` : money);
  }
  if (item.seats != null) parts.push(`${item.seats} seat${item.seats === 1 ? "" : "s"}`);
  if (item.owner) parts.push(`Owner: ${item.owner}`);

  let renewal: { text: string; tone: string } | null = null;
  let notice: string | null = null;
  if (item.renewal_date) {
    const r = new Date(`${item.renewal_date.slice(0, 10)}T00:00:00Z`);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((r.getTime() - today) / DAY);
    if (days < 0) renewal = { text: "Renewal date passed", tone: "text-muted-foreground italic" };
    else
      renewal = {
        text: `Renews ${fmtDate(r)} · ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`,
        tone: days <= 60 ? "text-warning" : "text-muted-foreground",
      };
    if (item.notice_days != null) notice = `Notice due by ${fmtDate(new Date(r.getTime() - item.notice_days * DAY))}`;
  }

  if (!parts.length && !renewal && !item.notes) return null;
  return (
    <div className="mt-3 space-y-1 text-sm">
      {parts.length > 0 && <p className="text-muted-foreground">{parts.join(" · ")}</p>}
      {renewal && (
        <p className={renewal.tone}>
          {renewal.text}
          {notice && <span> · {notice}</span>}
          {item.auto_renews != null && <span> · {item.auto_renews ? "Auto-renews" : "Does not auto-renew"}</span>}
        </p>
      )}
      {item.notes && <p className="line-clamp-2 whitespace-pre-line text-muted-foreground">{item.notes}</p>}
    </div>
  );
}

function EditPanel({ item, onCancel, onSaved }: { item: StackItem; onCancel: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: item.name,
    item_type: item.item_type,
    category: item.category ?? "",
    stage: item.stage,
    owner: item.owner ?? "",
    vendor_contact: item.vendor_contact ?? "",
    cost_amount: item.cost_amount?.toString() ?? "",
    cost_period: item.cost_period ?? "",
    currency: item.currency || "EUR",
    seats: item.seats?.toString() ?? "",
    renewal_date: item.renewal_date?.slice(0, 10) ?? "",
    notice_days: item.notice_days?.toString() ?? "",
    auto_renews: item.auto_renews == null ? "" : item.auto_renews ? "yes" : "no",
    notes: item.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setError(null);
    if (!f.name.trim()) return setError("Name is required.");
    const num = (v: string, label: string, int: boolean): number | null | "bad" => {
      if (!v.trim()) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || (int && !Number.isInteger(n))) {
        setError(`${label} must be a non-negative ${int ? "whole " : ""}number.`);
        return "bad";
      }
      return n;
    };
    const cost = num(f.cost_amount, "Cost", false);
    const seats = num(f.seats, "Seats", true);
    const notice = num(f.notice_days, "Notice period", true);
    if (cost === "bad" || seats === "bad" || notice === "bad") return;
    const txt = (v: string) => v.trim() || null;
    setSaving(true);
    try {
      await updateStackItem(item.id, {
        name: f.name,
        item_type: f.item_type,
        category: (f.category || null) as Category | null,
        stage: f.stage,
        owner: txt(f.owner),
        vendor_contact: txt(f.vendor_contact),
        cost_amount: cost,
        cost_period: (f.cost_period || null) as StackItem["cost_period"],
        currency: f.currency as StackItem["currency"],
        seats,
        renewal_date: f.renewal_date || null,
        notice_days: notice,
        auto_renews: f.auto_renews === "" ? null : f.auto_renews === "yes",
        notes: txt(f.notes),
      });
      onSaved();
    } catch {
      setError("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, el: React.ReactNode) => (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      {el}
    </label>
  );

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("Name", <input className={inputClass} value={f.name} onChange={set("name")} />)}
        {field(
          "Type",
          <select className={inputClass} value={f.item_type} onChange={set("item_type")}>
            <option value="tool">Tool / App / Software</option>
            <option value="data_source">Data source</option>
          </select>,
        )}
        {field(
          "Category",
          <select className={inputClass} value={f.category} onChange={set("category")}>
            <option value="">Other / none</option>
            <option value="bi">BI</option>
            <option value="crm">CRM</option>
            <option value="warehouse">Data Warehouse</option>
            <option value="erp">ERP</option>
          </select>,
        )}
        {field(
          "Stage",
          <select className={inputClass} value={f.stage} onChange={set("stage")}>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>,
        )}
        {field("Owner", <input className={inputClass} value={f.owner} onChange={set("owner")} placeholder="Person or team" />)}
        {field("Vendor contact", <input className={inputClass} value={f.vendor_contact} onChange={set("vendor_contact")} placeholder="Name, email or phone" />)}
        {field(
          "Cost",
          <div className="flex gap-2">
            <input className={`${inputClass} min-w-0 flex-1`} inputMode="decimal" aria-label="Cost amount" value={f.cost_amount} onChange={set("cost_amount")} />
            <select className={inputClass} aria-label="Cost period" value={f.cost_period} onChange={set("cost_period")}>
              <option value="">—</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
            <select className={inputClass} aria-label="Currency" value={f.currency} onChange={set("currency")}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>,
        )}
        {field("Seats", <input className={inputClass} inputMode="numeric" value={f.seats} onChange={set("seats")} />)}
        {field("Renewal date", <input type="date" className={inputClass} value={f.renewal_date} onChange={set("renewal_date")} />)}
        {field("Notice period (days)", <input className={inputClass} inputMode="numeric" value={f.notice_days} onChange={set("notice_days")} />)}
        {field(
          "Auto-renews",
          <select className={inputClass} value={f.auto_renews} onChange={set("auto_renews")}>
            <option value="">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>,
        )}
      </div>
      {field("Notes", <textarea rows={4} className={inputClass} value={f.notes} onChange={set("notes")} />)}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-accent disabled:opacity-40" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
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
            : item.category === "erp"
              ? buildErpImplementationPlan(tool as ErpTool, item.answers, profile)
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
