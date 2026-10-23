"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Not logged in? Go to the login page.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between">
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
      <p className="mt-8 text-slate-600">You are logged in. The board comes next.</p>
    </main>
  );
}