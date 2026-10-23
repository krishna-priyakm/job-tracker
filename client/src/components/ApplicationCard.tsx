"use client";

import { Application, Status, STATUSES, STATUS_LABELS } from "@/lib/types";

type Props = {
  application: Application;
  onMove: (id: string, status: Status) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
};

export default function ApplicationCard({ application, onMove, onEdit, onDelete }: Props) {
  const selectId = "status-" + application.id;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", application.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <h3 className="font-semibold">{application.company}</h3>
      <p className="text-sm text-slate-600">{application.role}</p>

      {application.salary && (
        <p className="mt-1 text-xs text-slate-500">{application.salary}</p>
      )}
      <p className="mt-1 text-xs text-slate-400">
        Applied {new Date(application.appliedOn).toLocaleDateString()}
      </p>
      {application.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{application.notes}</p>
      )}
      {application.jobUrl && (
        <a
          href={application.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline"
        >
          View job posting
        </a>
      )}

      <div className="mt-3">
        <label htmlFor={selectId} className="sr-only">
          Change status
        </label>
        <select
          id={selectId}
          value={application.status}
          onChange={(e) => onMove(application.id, e.target.value as Status)}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex gap-3 text-xs">
        <button onClick={() => onEdit(application)} className="text-indigo-600 hover:underline">
          Edit
        </button>
        <button onClick={() => onDelete(application)} className="text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </article>
  );
}