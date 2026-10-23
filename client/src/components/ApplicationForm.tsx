"use client";

import { FormEvent, useEffect, useState } from "react";
import { Application, Status, STATUSES, STATUS_LABELS } from "@/lib/types";

type Props = {
  application: Application | null;
  onSave: (data: Record<string, string>, id: string | null) => Promise<string | null>;
  onClose: () => void;
};

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function ApplicationForm({ application, onSave, onClose }: Props) {
  const [company, setCompany] = useState(application?.company ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [jobUrl, setJobUrl] = useState(application?.jobUrl ?? "");
  const [salary, setSalary] = useState(application?.salary ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [status, setStatus] = useState<Status>(application?.status ?? "APPLIED");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Close with the Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const data: Record<string, string> = {
      company: company.trim(),
      role: role.trim(),
      status: status,
      salary: salary.trim(),
      notes: notes.trim(),
    };
    // The API only accepts a valid URL, so leave it out when empty
    if (jobUrl.trim()) {
      data.jobUrl = jobUrl.trim();
    }

    const message = await onSave(data, application ? application.id : null);
    setSaving(false);
    if (message) {
      setError(message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="form-title" className="text-lg font-bold">
          {application ? "Edit application" : "Add application"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="company" className="block text-sm font-medium">
              Company *
            </label>
            <input
              id="company"
              required
              autoFocus
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium">
              Role *
            </label>
            <input
              id="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="jobUrl" className="block text-sm font-medium">
              Job link
            </label>
            <input
              id="jobUrl"
              type="url"
              placeholder="https://..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="salary" className="block text-sm font-medium">
                Salary
              </label>
              <input
                id="salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}