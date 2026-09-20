import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/match", label: "New Match" },
  { to: "/profile", label: "My Profile" },
  { to: "/settings", label: "Settings" },
  { to: "/guide", label: "Guide" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary text-accent"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-border pt-4">
      {user ? (
        <div className="space-y-2">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("platfometrix_guest");
              }
              void supabase.auth.signOut();
              setOpen(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Log out
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          onClick={() => setOpen(false)}
          className="text-xs text-accent"
        >
          Log in
        </Link>
      )}
    </div>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col justify-between p-6">
      <div>
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent"
        >
          Platfometrix
        </Link>
        <div className="mt-8">{nav}</div>
      </div>
      {footer}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card lg:block">
        {sidebarInner}
      </aside>

      <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:hidden">
        <Link
          to="/"
          className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent"
        >
          Platfometrix
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card">
            {sidebarInner}
          </aside>
        </div>
      )}

      <main className="lg:pl-60">{children}</main>
    </div>
  );
}
