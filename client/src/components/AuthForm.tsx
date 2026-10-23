"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  // Already logged in? Go to the dashboard.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const message = isLogin ? await login(email, password) : await register(email, password);
    setSubmitting(false);
    if (message) {
      setError(message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-indigo-600">Job Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? "Log in to your account" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {!isLogin && (
              <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium text-indigo-600 hover:underline"
          >
            {isLogin ? "Create an account" : "Log in"}
          </Link>
        </p>
      </div>
    </main>
  );
}