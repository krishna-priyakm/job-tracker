import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import applicationRoutes from "./routes/applications";
import statsRoutes from "./routes/stats";

const app = express();

app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.json({ok:true});
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/stats", statsRoutes);

export default app;
