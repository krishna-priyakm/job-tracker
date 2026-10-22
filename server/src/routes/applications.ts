import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const statusEnum = z.enum(["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]);

const createSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  jobUrl: z.string().url().optional(),
  status: statusEnum.optional(),
  salary: z.string().optional(),
  notes: z.string().optional(),
  appliedOn: z.coerce.date().optional(),
  followUpOn: z.coerce.date().optional(),
});

const updateSchema = createSchema.partial();

const listSchema = z.object({
  status: statusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "oldest", "company"]).default("newest"),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;
  const userId = res.locals.userId as string;

  const application = await prisma.application.create({
    data: {
      ...data,
      userId,
      history: {
        create: { fromStatus: null, toStatus: data.status ?? "APPLIED" },
      },
    },
  });

  res.status(201).json({ application });
});

router.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { status, search, page, limit, sort } = parsed.data;
  const userId = res.locals.userId as string;

  const where: any = { userId };
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  if (sort === "company") orderBy = { company: "asc" };

  const [items, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  res.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/:id", async (req, res) => {
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: res.locals.userId },
    include: { history: { orderBy: { changedAt: "desc" } } },
  });
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }
  res.json({ application });
});

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  const existing = await prisma.application.findFirst({
    where: { id: req.params.id, userId: res.locals.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Application not found" });
  }

  const statusChanged = data.status !== undefined && data.status !== existing.status;

  const application = await prisma.application.update({
    where: { id: existing.id },
    data: {
      ...data,
      ...(statusChanged
        ? {
            history: {
              create: { fromStatus: existing.status, toStatus: data.status! },
            },
          }
        : {}),
    },
  });

  res.json({ application });
});

router.delete("/:id", async (req, res) => {
  const result = await prisma.application.deleteMany({
    where: { id: req.params.id, userId: res.locals.userId },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: "Application not found" });
  }
  res.status(204).send();
});

export default router;