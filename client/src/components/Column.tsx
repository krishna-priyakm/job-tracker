"use client";

import { DragEvent, ReactNode, useState } from "react";
import { Status, STATUS_LABELS } from "@/lib/types";

type Props = {
  status: Status;
  count: number;
  onDropCard: (id: string, status: Status) => void;
  children: ReactNode;
};

export default function Column({ status, count, onDropCard, children }: Props) {
  const [over, setOver] = useState(false);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); // without this, the browser refuses the drop
    setOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    // Ignore "leave" events caused by moving over a card inside this column
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOver(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      onDropCard(id, status);
    }
  }

  return (
    <section aria-label={STATUS_LABELS[status]}>
      <h2 className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
        {STATUS_LABELS[status]}
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{count}</span>
      </h2>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={
          "min-h-24 space-y-3 rounded-lg p-2 transition-colors " +
          (over ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-slate-100")
        }
      >
        {children}
      </div>
    </section>
  );
}