"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Application, Stats, Status, STATUSES } from "@/lib/types";
import ApplicationCard from "@/components/ApplicationCard";
import Column from "@/components/Column";
import ApplicationForm from "@/components/ApplicationForm";
import StatsBar from "@/components/StatsBar";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);

  // Not logged in? Go to the login page.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const load = useCallback(async () => {
    try {
      const query = "?limit=50" + (search ? "&search=" + encodeURIComponent(search) : "");
      const [appsRes, statsRes] = await Promise.all([
        apiFetch("/api/applications" + query),
        apiFetch("/api/stats"),
      ]);
      if (!appsRes.ok || !statsRes.ok) {
        setError("Could not load your applications.");
      } else {
        const appsData = await appsRes.json();
        setApplications(appsData.items);
        setStats(await statsRes.json());
        setError("");
      }
    } catch {
      setError("Cannot reach the server. Is it running?");
    }
    setDataLoading(false);
  }, [search]);

  // Load on start, and 300 ms after the user stops typing in the search box
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [user, load]);

  async function handleSave(data: Record<string, string>, id: string | null) {
    try {
      const res = await apiFetch(id ? "/api/applications/" + id : "/api/applications", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        return (body.error as string) || "Could not save";
      }
      setFormOpen(false);
      setEditing(null);
      await load();
      return null;
    } catch {
      return "Cannot reach the server. Is it running?";
    }
  }

    async function handleMove(id: string, status: Status) {
    const current = applications.find((a) => a.id === id);
    if (!current || current.status === status) {
      return;
    }

    // Optimistic update: show the move immediately
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: status } : a)));

    const res = await apiFetch("/api/applications/" + id, {
      method: "PATCH",
      body: JSON.stringify({ status: status }),
    });
    if (!res.ok) {
      setError("Could not change the status.");
    }
    // Reload from the server: confirms the move, or puts the card back if it failed
    await load();
  }

  async function handleDelete(application: Application) {
    if (!window.confirm("Delete " + application.company + " - " + application.role + "?")) {
      return;
    }
    const res = await apiFetch("/api/applications/" + application.id, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete the application.");
    }
    await load();
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(application: Application) {
    setEditing(application);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-indigo-600">Job Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user.email}</span>
          <button
            onClick={logout}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <StatsBar stats={stats} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="search" className="sr-only">
          Search applications
        </label>
        <input
          id="search"
          type="search"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={openAdd}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add application
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {dataLoading ? (
        <p className="mt-8 text-slate-500">Loading applications...</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {STATUSES.map((status) => {
            const items = applications.filter((a) => a.status === status);
            return (
              <Column key={status} status={status} count={items.length} onDropCard={handleMove}>
                {items.length === 0 && (
                  <p className="p-2 text-xs text-slate-400">Nothing here yet</p>
                )}
                {items.map((a) => (
                  <ApplicationCard
                    key={a.id}
                    application={a}
                    onMove={handleMove}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </Column>
            );
          })}
        </div>
      )}

      {formOpen && (
        <ApplicationForm application={editing} onSave={handleSave} onClose={closeForm} />
      )}
    </main>
  );
}