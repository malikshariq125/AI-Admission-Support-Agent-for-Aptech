import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database for leads
  const db = new Database("leads.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      contactNumber TEXT NOT NULL,
      address TEXT NOT NULL,
      courseOfInterest TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.use(express.json());

  // API route for lead capture
  app.post("/api/leads", (req, res) => {
    const { fullName, contactNumber, address, courseOfInterest } = req.body;
    
    if (!fullName || !contactNumber || !address || !courseOfInterest) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const stmt = db.prepare(
        "INSERT INTO leads (fullName, contactNumber, address, courseOfInterest) VALUES (?, ?, ?, ?)"
      );
      stmt.run(fullName, contactNumber, address, courseOfInterest);
      res.json({ success: true, message: "Lead captured successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });

  // API route to get leads (for admin/marketing)
  app.get("/api/leads", (req, res) => {
    try {
      const leads = db.prepare("SELECT * FROM leads ORDER BY createdAt DESC").all();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
