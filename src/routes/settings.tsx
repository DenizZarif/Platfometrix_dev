import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Platfometrix" },
      {
        name: "description",
        content: "Manage your Platfometrix account: your email, your password and signing out.",
      },
      { property: "og:title", content: "Settings — Platfometrix" },
      { property: "og:description", content: "Manage your Platfometrix account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function SettingsPage() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (loading) {
    return <AppShell>{null}</AppShell>;
  }

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Log in to see your settings</h1>
          <p className="mt-3 text-muted-foreground">
            Your account details live behind your login.
          </p>
        </section>
        <AuthModal open onClose={() => {}} />
      </AppShell>
    );
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password !== confirm) {
      setStatus("error");
      setMessage("Those passwords don't match.");
      return;
    }
    setStatus("saving");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Couldn't update your password.");
    }
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">Settings</h1>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Account</h2>
          <p className="mt-3 text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 text-sm">{user.email}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Change password</h2>
          <form onSubmit={changePassword} className="mt-4 space-y-3">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setStatus("idle");
                setMessage(null);
              }}
              placeholder="New password"
              className={inputClass}
            />
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setStatus("idle");
                setMessage(null);
              }}
              placeholder="Confirm new password"
              className={inputClass}
            />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === "saving"}
                className="btn-accent disabled:opacity-40"
              >
                {status === "saving" ? "Saving…" : "Update password"}
              </button>
              {status === "saved" && <span className="text-sm text-accent">Password updated</span>}
              {status === "error" && (
                <span className="text-sm text-destructive">
                  {message ?? "Couldn't save — please try again."}
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              void supabase.auth.signOut();
            }}
            className="btn-ghost"
          >
            Log out
          </button>
        </div>
      </section>
    </AppShell>
  );
}
