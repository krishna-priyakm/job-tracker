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

function auth(token: string) {
  return { Authorization: "Bearer " + token };
}

async function createApp(token: string, body: object) {
  return request(app).post("/api/applications").set(auth(token)).send(body);
}

describe("applications", () => {
  it("blocks requests without a token", async () => {
    const res = await request(app).get("/api/applications");
    expect(res.status).toBe(401);
  });

  it("creates an application with a default status", async () => {
    const token = await registerUser();
    const res = await createApp(token, { company: "Google", role: "Frontend Developer" });
    expect(res.status).toBe(201);
    expect(res.body.application.status).toBe("APPLIED");
  });

  it("rejects an empty company", async () => {
    const token = await registerUser();
    const res = await createApp(token, { company: "", role: "Dev" });
    expect(res.status).toBe(400);
  });

  it("lists, searches and paginates", async () => {
    const token = await registerUser();
    await createApp(token, { company: "Google", role: "Frontend Developer" });
    await createApp(token, { company: "Zoho", role: "Full Stack Developer" });
    await createApp(token, { company: "Infosys", role: "Software Engineer" });

    const all = await request(app).get("/api/applications").set(auth(token));
    expect(all.body.total).toBe(3);

    const search = await request(app).get("/api/applications?search=zoho").set(auth(token));
    expect(search.body.items.length).toBe(1);
    expect(search.body.items[0].company).toBe("Zoho");

    const sorted = await request(app).get("/api/applications?sort=company").set(auth(token));
    expect(sorted.body.items[0].company).toBe("Google");

    const page2 = await request(app).get("/api/applications?limit=2&page=2").set(auth(token));
    expect(page2.body.items.length).toBe(1);
    expect(page2.body.totalPages).toBe(2);
  });

  it("writes a history row when the status changes", async () => {
    const token = await registerUser();
    const created = await createApp(token, { company: "Google", role: "Dev" });
    const id = created.body.application.id;

    const patched = await request(app)
      .patch("/api/applications/" + id)
      .set(auth(token))
      .send({ status: "INTERVIEW" });
    expect(patched.status).toBe(200);
    expect(patched.body.application.status).toBe("INTERVIEW");

    const one = await request(app).get("/api/applications/" + id).set(auth(token));
    expect(one.body.application.history.length).toBe(2);
  });

  it("does not let one user see another user's application", async () => {
    const tokenA = await registerUser("a@example.com");
    const tokenB = await registerUser("b@example.com");
    const created = await createApp(tokenA, { company: "Google", role: "Dev" });
    const id = created.body.application.id;

    const res = await request(app).get("/api/applications/" + id).set(auth(tokenB));
    expect(res.status).toBe(404);

    const list = await request(app).get("/api/applications").set(auth(tokenB));
    expect(list.body.total).toBe(0);
  });

  it("deletes an application and then returns 404", async () => {
    const token = await registerUser();
    const created = await createApp(token, { company: "Google", role: "Dev" });
    const id = created.body.application.id;

    const first = await request(app).delete("/api/applications/" + id).set(auth(token));
    expect(first.status).toBe(204);

    const second = await request(app).delete("/api/applications/" + id).set(auth(token));
    expect(second.status).toBe(404);
  });

  it("returns correct stats", async () => {
    const token = await registerUser();
    const created = await createApp(token, { company: "Google", role: "Dev" });
    await createApp(token, { company: "Zoho", role: "Dev" });
    await createApp(token, { company: "Infosys", role: "Dev" });
    await request(app)
      .patch("/api/applications/" + created.body.application.id)
      .set(auth(token))
      .send({ status: "INTERVIEW" });

    const res = await request(app).get("/api/stats").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.byStatus.APPLIED).toBe(2);
    expect(res.body.byStatus.INTERVIEW).toBe(1);
    expect(res.body.responseRate).toBe(33);
  });
});