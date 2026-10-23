import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/prisma";
import { registerUser } from "./helpers";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth", () => {
  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe("a@example.com");
  });

  it("rejects a duplicate email", async () => {
    await registerUser("a@example.com");
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("rejects a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "123" });
    expect(res.status).toBe(400);
  });

  it("logs in with the right password", async () => {
    await registerUser("a@example.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    await registerUser("a@example.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("blocks /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("allows /me with a token", async () => {
    const token = await registerUser("a@example.com");
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer " + token);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("a@example.com");
  });

  it("refreshes and then fails after logout", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "password123" });

    const refreshed = await agent.post("/api/auth/refresh");
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeDefined();

    await agent.post("/api/auth/logout");

    const afterLogout = await agent.post("/api/auth/refresh");
    expect(afterLogout.status).toBe(401);
  });
});