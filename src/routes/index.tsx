import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { listSavedResults, type SavedResultRow } from "@/lib/profileStore";
import { CATEGORY_CONFIG, type Category } from "@/lib/categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Platfometrix" },
      {
        name: "description",
        content:
          "Start a new BI, CRM or data warehouse match and revisit the shortlists you've already saved.",
      },
      { property: "og:title", content: "Platfometrix — Software Tool Matcher" },
      {
        property: "og:description",
        content:
          "Personalized, transparent shortlists for BI, CRM and data warehouse tools, scored against your budget and team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SavedResultRow[]>([]);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    listSavedResults(user.id)
      .then((r) => setRows(r.slice(0, 3)))
      .catch(() => setRows([]));
  }, [user]);

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">Welcome to Platfometrix</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Pick a category and answer a short set of questions — you'll get a ranked shortlist with
          the reasoning and an estimated cost behind every result.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((c) => {
            const cfg = CATEGORY_CONFIG[c];
            return (
              <Link
                key={c}
                to="/match"
                search={{ category: c }}
                className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-accent"
              >
                <h2 className="font-display text-2xl font-semibold">{cfg.label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{cfg.tagline}</p>
                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-accent">
                  {cfg.toolCount} tools · {cfg.questions.length} questions
                </p>
              </Link>
            );
          })}
        </div>

        {user ? (
          <div className="mt-16">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold tracking-tight">Recent shortlists</h2>
              <Link to="/profile" className="text-sm text-accent">
                View all in My Profile
              </Link>
            </div>

            {rows.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                You haven't saved a shortlist yet. Run a match and hit “Save this result”.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {rows.map((row) => {
                  const top = row.results[0];
                  return (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="badge">{row.category.toUpperCase()}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(row.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-display font-semibold">{top?.tool.name ?? "—"}</span>
                      </div>
                      <span className="font-display text-xl font-bold text-accent">
                        {top?.finalScore ?? ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-12 text-sm text-muted-foreground">
            <Link to="/login" className="text-accent">
              Log in
            </Link>{" "}
            to save your shortlists and revisit them later.
          </p>
        )}
      </section>
    </AppShell>
  );
}
