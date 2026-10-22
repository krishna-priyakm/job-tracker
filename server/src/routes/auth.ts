import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const REFRESH_SECONDS = 60 * 60 * 24 * 7;

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const credentialsSchema = z.object({ email: emailSchema, password: passwordSchema });

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15m",
  });
}

async function issueRefreshToken(userId: string, res: Response) {
  const token = jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_SECONDS }
  );

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_SECONDS * 1000),
    },
  });

  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_SECONDS * 1000,
    path: "/api/auth",
  });
}

router.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  await issueRefreshToken(user.id, res);

  res.status(201).json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
  });
});

router.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  await issueRefreshToken(user.id, res);

  res.json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
  });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "No refresh token" });
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload;
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(token), userId: payload.sub as string },
  });
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token expired or revoked" });
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  await issueRefreshToken(stored.userId, res);

  res.json({ accessToken: signAccessToken(stored.userId) });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: res.locals.userId },
    select: { id: true, email: true, createdAt: true },
  });
  res.json({ user });
});

export default router;