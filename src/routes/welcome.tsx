import { useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Platfometrix" },
      {
        name: "description",
        content:
          "Find the BI, CRM or data warehouse tool that actually fits your team.",
      },
      { property: "og:title", content: "Welcome — Platfometrix" },
      {
        property: "og:description",
        content:
          "Find the BI, CRM or data warehouse tool that actually fits your team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  if (loading || user) {
    return null;
  }

  const continueAsGuest = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("platfometrix_guest", "1");
    }
    void navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md space-y-10 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-accent">
          Platfometrix
        </h1>
        <p className="text-lg text-muted-foreground">
          Find the BI, CRM or data warehouse tool that actually fits your team.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={continueAsGuest}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
