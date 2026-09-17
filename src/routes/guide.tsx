import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide — How Platfometrix Works" },
      {
        name: "description",
        content:
          "How Platfometrix filters and scores BI, CRM and data warehouse tools against your answers, and how to read your score breakdown and cost estimate.",
      },
      { property: "og:title", content: "Guide — How Platfometrix Works" },
      {
        property: "og:description",
        content:
          "Hard requirements filter the list, published weights score the rest, and every result shows exactly why it ranked where it did.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">How Platfometrix works</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No sponsored rankings, no vague "top 10" list. You answer a short profile, we filter out
          anything that can't work for you, and everything that's left is scored against your
          answers with weights you can see.
        </p>

        <div className="mt-12 space-y-6 text-muted-foreground">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              1. You answer a short profile
            </h2>
            <p className="mt-3">
              Nine to eleven questions, depending on the category: budget, team size, who looks
              after the system, compliance requirements, and the things specific to that kind of
              software. If you have an account, the shared answers are remembered and prefilled the
              next time.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              2. Hard requirements filter the list
            </h2>
            <p className="mt-3">
              Some answers are non-negotiable. If you need a specific certification, tools without
              it are removed. If you need to self-host, fully managed-only platforms are removed. If
              a filter would leave nothing at all, we relax it rather than show you an empty page —
              and the scoring then reflects the gap instead.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              3. Everything else is scored with published weights
            </h2>
            <p className="mt-3">
              Each remaining tool is scored on every criterion that applies to your answers — budget
              fit, usability, customization, and the category-specific ones. Each criterion has a
              fixed weight, the weights are renormalized over whichever criteria actually apply to
              you, and the result is a score out of 100.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              4. Every result explains itself
            </h2>
            <p className="mt-3">
              Each card names the two things the tool does best for your situation, and the one
              thing most likely to bother you. Nothing is hidden behind a single opaque number.
            </p>
          </div>
        </div>

        <h2 className="font-display mt-16 text-2xl font-bold tracking-tight">The categories</h2>
        <div className="mt-6 space-y-6 text-muted-foreground">
          <p>
            <span className="font-display font-semibold text-foreground">BI &amp; Reporting</span> —
            dashboards, self-service exploration, embedded analytics and ad-hoc SQL. Scored on how
            reports get built, row-level security, connector breadth, data volume and how much setup
            you're willing to do.
          </p>
          <p>
            <span className="font-display font-semibold text-foreground">CRM</span> — pipeline,
            contacts and the day-to-day sales workflow. Scored on built-in email and calling,
            marketing automation depth, mobile quality, reporting depth and how configurable the
            system is.
          </p>
          <p>
            <span className="font-display font-semibold text-foreground">
              Data Warehousing &amp; Pipelines
            </span>{" "}
            — where your analytical data actually lives. Scored on your data scale, main workload,
            cloud provider, deployment model, built-in ingestion and whether you need real-time.
            Ingestion is scored as a capability of each platform rather than as a separate category
            of tool, because an ELT tool isn't a substitute for a warehouse.
          </p>
        </div>

        <h2 className="font-display mt-16 text-2xl font-bold tracking-tight">
          Understanding your score breakdown
        </h2>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>
            Open "Show score breakdown" on any result and you get the full table: every criterion,
            the raw score it earned from 0 to 1, the weight that criterion carries for your answers,
            and the resulting contribution to the final number. Add the contributions up and you get
            the score on the card — nothing else goes into it.
          </p>
          <p>
            "Show cost breakdown" is separate and never affects the ranking. It estimates a monthly
            and annual range from the tool's pricing model and your company size or data scale, then
            lists the pricing model, cost tier, implementation effort, realistic time to value and
            the hidden costs people commonly hit. Treat it as a planning range to sanity-check a
            vendor quote, not as a quote itself.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
