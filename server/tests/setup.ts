   import dotenv from "dotenv";

   dotenv.config({ path: ".env.test", override: true });

   if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("jobtracker_test")) {
     throw new Error("Tests must use the jobtracker_test database");
   }