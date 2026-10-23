import { Stats } from "@/lib/types";

export default function StatsBar({ stats }: { stats: Stats | null }) {
  const items = [
    { label: "Total", value: stats ? String(stats.total) : "-" },
    { label: "Interviews", value: stats ? String(stats.byStatus.INTERVIEW ?? 0) : "-" },
    { label: "Offers", value: stats ? String(stats.byStatus.OFFER ?? 0) : "-" },
    { label: "Response rate", value: stats ? stats.responseRate + "%" : "-" },
  ];

  return (
    <section aria-label="Statistics" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{item.value}</p>
        </div>
      ))}
    </section>
  );
}