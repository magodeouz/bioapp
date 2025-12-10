import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import compression from "compression";
import serveStatic from "serve-static";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const publicDir = path.join(__dirname, "public");

app.use(compression());
app.use(express.json());

// Simple health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve static assets
app.use(
  serveStatic(publicDir, {
    extensions: ["html"],
    index: ["login.html", "index.html"],
    maxAge: "1h",
  })
);

// Public profile route bioflow.me/[username]
app.get("/:username", (req, res, next) => {
  const { username } = req.params;
  // Skip if the path is a known file or directory request
  if (username.includes(".") || username === "assets") {
    return next();
  }
  return res.sendFile(path.join(publicDir, "profile", "index.html"));
});

// Fallback to login
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "auth", "login.html"));
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
  console.log(`BioFlow dev server running at http://localhost:${port}`);
});

