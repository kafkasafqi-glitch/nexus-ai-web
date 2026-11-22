import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = "https://kafkasafqi-glitch.github.io";

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "32kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "NEXUS AI API" }));

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.DEATCODE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Server belum dikonfigurasi. DEATCODE_API_KEY belum dipasang." });

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
      return res.status(400).json({ error: "Format percakapan tidak valid." });
    }

    const safeMessages = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))
      .filter(m => m.content);

    if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Pesan terakhir harus berasal dari pengguna." });
    }

    const response = await fetch("https://copilot.api-github.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.DEATCODE_MODEL || "claude-opus-5.5",
        messages: [
          { role: "system", content: "Kamu adalah NEXUS AI, asisten pribadi yang ramah, cerdas, jujur, dan membantu. Balas dalam bahasa yang digunakan pengguna. Jika pengguna memakai bahasa Indonesia santai, balas dengan bahasa Indonesia santai." },
          ...safeMessages
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("DeatCode API error:", response.status, data?.error?.code || "unknown");
      return res.status(response.status === 401 ? 502 : 502).json({ error: "Layanan AI menolak permintaan. Periksa API key, kredit, dan nama model di dashboard penyedia." });
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({ error: "AI belum memberikan jawaban. Coba kirim ulang." });
    }
    res.json({ reply: answer.trim() });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan pada server NEXUS AI." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`NEXUS AI API running on port ${PORT}`));
