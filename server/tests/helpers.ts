   import request from "supertest";
   import app from "../src/app";

   export async function registerUser(email = "user@example.com") {
     const res = await request(app)
       .post("/api/auth/register")
       .send({ email: email, password: "password123" });
     return res.body.accessToken as string;
   }