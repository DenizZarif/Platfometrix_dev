import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { StackItem } from "@/lib/stackStore";
import {
  describeEntryChanges,
  diffStates,
  fieldLabel,
  formatMoney,
  formatValue,
  listStackHistory,
  reconstructItemStates,
  STAGE_LABEL,
  type ItemState,
  type StackHistoryEntry,
} from "@/lib/stackHistory";

type ActionFilter = "all" | "created" | "updated" | "deleted";
const ACTION_CHIPS: { value: ActionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Changed" },
  { value: "deleted", label: "Removed" },
];
const BADGE: Record<StackHistoryEntry["action"], string> = {
  baseline: "Baseline", created: "Added", updated: "Changed", deleted: "Removed",
};
const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function StackHistory({
  userId,
  items,
  itemId,
  onItemChange,
}: {
  userId: string;
  items: StackItem[];
  itemId: string | null;
  onItemChange: (id: string | null) => void;
}) {
  const [entries, setEntries] = useState<StackHistoryEntry[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [itemOptions, setItemOptions] = useState<{ id: string; name: string }[]>([]);
  const [action, setAction] = useState<ActionFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [itemTimeline, setItemTimeline] = useState<StackHistoryEntry[] | null>(null);

  const load = useCallback(
    async (before?: string) => {
      setError(null);
      try {
        const res = await listStackHistory(userId, { itemId: itemId ?? undefined, before });
        setEntries((prev) => (before && prev ? [...prev, ...res.entries] : res.entries));
        setHasMore(res.hasMore);
      } catch {
        setError("Couldn't load history — please try again.");
        if (!before) setEntries([]);
      }
    },
    [userId, itemId],
  );

  useEffect(() => {
    setEntries(null);
    void load();
  }, [load]);

  // Item options: every item that appears in history (latest name first seen = newest).
  useEffect(() => {
    void listStackHistory(userId, { limit: 1000 }).then(({ entries: all }) => {
      const seen = new Map<string, string>();
      for (const e of all) if (!seen.has(e.stack_item_id)) seen.set(e.stack_item_id, e.item_name);
      for (const i of items) if (!seen.has(i.id)) seen.set(i.id, i.name);
      setItemOptions([...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => {});
  }, [userId, items]);

  // Full timeline for the selected item, for reconstruction / compare.
  useEffect(() => {
    setItemTimeline(null);
    if (!itemId) return;
    void listStackHistory(userId, { itemId, limit: 1000 })
      .then(({ entries: all }) => setItemTimeline([...all].reverse()))
      .catch(() => {});
  }, [userId, itemId, entries]);

  const reconstructed = useMemo(() => {
    const map = new Map<string, { state: ItemState; before: ItemState }>();
    if (!itemTimeline) return { map, canCompare: false };
    for (const s of reconstructItemStates(itemTimeline)) map.set(s.entryId, s);
    const first = itemTimeline[0];
    const canCompare = !!first && (first.action === "baseline" || first.action === "created");
    return { map, canCompare };
  }, [itemTimeline]);

  const currentItem = itemId ? items.find((i) => i.id === itemId) ?? null : null;
  const currentState: ItemState | null = currentItem ? { ...currentItem } : null;
  const selectedName = itemOptions.find((o) => o.id === itemId)?.name ?? currentItem?.name ?? "Selected item";

  const visible = (entries ?? []).filter((e) =>
    action === "all" ? true : action === "created" ? e.action === "created" || e.action === "baseline" : e.action === action,
  );

  const groups: { day: string; list: StackHistoryEntry[] }[] = [];
  for (const e of visible) {
    const day = new Date(e.created_at).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.list.push(e);
    else groups.push({ day, list: [e] });
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter by item"
          className={inputClass}
          value={itemId ?? ""}
          onChange={(e) => onItemChange(e.target.value || null)}
        >
          <option value="">All items</option>
          {itemOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {items.some((i) => i.id === o.id) ? "" : " (removed)"}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {ACTION_CHIPS.map((c) => (
            <button
              key={c.value}
              onClick={() => setAction(c.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs",
                action === c.value
                  ? "border-accent text-accent"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        {(itemId || action !== "all") && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setAction("all");
              onItemChange(null);
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {itemId && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent px-3 py-1 text-xs text-accent">
            {selectedName}
            <button aria-label="Remove item filter" onClick={() => onItemChange(null)}>
              ×
            </button>
          </span>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {entries === null ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading history…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No changes recorded yet. Edits you make to your stack will show up here.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <div key={g.day}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.day}</h3>
              <ul className="mt-3 space-y-3">
                {g.list.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    before={reconstructed.map.get(e.id)?.before ?? null}
                    after={reconstructed.map.get(e.id)?.state ?? null}
                    current={
                      itemId && currentState && reconstructed.canCompare && e.action !== "deleted"
                        ? currentState
                        : null
                    }
                  />
                ))}
              </ul>
            </div>
          ))}
          {hasMore && (
            <button
              className="btn-ghost"
              onClick={() => void load(entries[entries.length - 1]?.created_at)}
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  before,
  after,
  current,
}: {
  entry: StackHistoryEntry;
  before: ItemState | null;
  after: ItemState | null;
  current: ItemState | null;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [compare, setCompare] = useState(false);
  const time = new Date(entry.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const ch = entry.changes ?? {};

  let lines: string[];
  if (entry.action === "deleted") {
    lines = ["Removed from your stack"];
  } else if (entry.action === "created" || entry.action === "baseline") {
    const v = (k: string) => ch[k]?.to;
    const head = `${entry.action === "created" ? "Added" : "Recorded"} as ${STAGE_LABEL[String(v("stage"))] ?? "—"}, ${formatValue("category", v("category"))}`;
    const extra: string[] = [];
    if (v("cost_amount") != null) extra.push(`Cost: ${formatMoney(v("cost_amount"), v("cost_period"), v("currency"))}`);
    for (const k of ["owner", "seats", "renewal_date", "notice_days", "auto_renews", "vendor_contact"]) {
      if (v(k) != null) extra.push(`${fieldLabel(k)}: ${formatValue(k, v(k))}`);
    }
    if (v("notes") != null) extra.push("Has notes");
    lines = [head, ...extra];
  } else {
    lines = describeEntryChanges(ch, before);
  }

  const diffs = compare && after && current ? diffStates(after, current) : [];

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{entry.item_name}</span>
        <span
          className={cn("badge", entry.action === "deleted" && "text-destructive")}
          title={entry.action === "baseline" ? "Starting point when history tracking began" : undefined}
        >
          {BADGE[entry.action]}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{time}</span>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {entry.action === "updated" && "notes" in ch && (
        <div className="mt-2">
          <button className="text-xs text-accent" onClick={() => setShowNotes((s) => !s)}>
            {showNotes ? "Hide changes" : "Show changes"}
          </button>
          {showNotes && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Before</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{ch.notes.from == null ? "—" : String(ch.notes.from)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">After</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{ch.notes.to == null ? "—" : String(ch.notes.to)}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {current && after && (
        <div className="mt-2">
          <button className="text-xs text-accent" onClick={() => setCompare((c) => !c)}>
            {compare ? "Hide comparison" : "Compare with today"}
          </button>
          {compare &&
            (diffs.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Same as today</p>
            ) : (
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1 pr-3 font-medium">Field</th>
                    <th className="py-1 pr-3 font-medium">Then</th>
                    <th className="py-1 font-medium">Now</th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.map((f) => (
                    <tr key={f} className="border-t border-border/60 align-top">
                      <td className="py-1 pr-3 text-muted-foreground">{fieldLabel(f)}</td>
                      <td className="whitespace-pre-wrap py-1 pr-3">{formatValue(f, after[f])}</td>
                      <td className="whitespace-pre-wrap py-1">{formatValue(f, current[f])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
        </div>
      )}
    </li>
  );
}
