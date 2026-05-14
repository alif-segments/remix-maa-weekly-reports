import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for PDF Export
  app.post("/api/export-pdf", async (req, res) => {
    try {
      const { url, options } = req.body;
      
      const response = await fetch('https://chrome.browserless.io/pdf?token=2UVwXRhkczVryuaf98d0e168ea643ba5bc7f60c0970f249cc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          options
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Browserless Error:', errorText);
        return res.status(response.status).json({ error: 'PDF generation failed', details: errorText });
      }

      const buffer = await response.buffer();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      res.send(buffer);
    } catch (error) {
      console.error('Export Proxy Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
