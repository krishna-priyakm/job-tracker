import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

router.get("/", async (_req, res) => {
  const userId = res.locals.userId as string;

  const grouped = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const byStatus: Record<string, number> = {
    APPLIED: 0,
    OA: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
  };
  let total = 0;
  for (const row of grouped) {
    byStatus[row.status] = row._count._all;
    total += row._count._all;
  }

  const responded = total - byStatus.APPLIED;
  const responseRate = total === 0 ? 0 : Math.round((responded / total) * 100);

  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
  const recent = await prisma.application.findMany({
    where: { userId, appliedOn: { gte: eightWeeksAgo } },
    select: { appliedOn: true },
  });

  const weekly: Record<string, number> = {};
  for (const item of recent) {
    const key = startOfWeek(item.appliedOn).toISOString().slice(0, 10);
    weekly[key] = (weekly[key] || 0) + 1;
  }

  res.json({ total, byStatus, responseRate, perWeek: weekly });
});

export default router;