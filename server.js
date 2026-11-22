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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Server belum dikonfigurasi. API key AI belum dipasang." });

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
      return res.status(400).json({ error: "Format percakapan tidak valid." });
    }

    const contents = [];
    for (const message of messages) {
      if (!message || !["user", "model"].includes(message.role) || typeof message.text !== "string") continue;
      const text = message.text.trim().slice(0, 4000);
      if (text) contents.push({ role: message.role, parts: [{ text }] });
    }
    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "Pesan terakhir harus berasal dari pengguna." });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Kamu adalah NEXUS AI, asisten pribadi yang ramah, cerdas, jujur, dan membantu. Balas dalam bahasa yang digunakan pengguna. Jika pengguna memakai bahasa Indonesia santai, balas dengan bahasa Indonesia santai. Jangan mengaku bisa melakukan tindakan yang belum dilakukan." }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini API error:", response.status, data?.error?.status || "unknown");
      return res.status(502).json({ error: "Layanan AI sedang bermasalah. Coba lagi sebentar." });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!answer) return res.status(502).json({ error: "AI belum memberikan jawaban. Coba kirim ulang." });
    res.json({ reply: answer });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan pada server NEXUS AI." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`NEXUS AI API running on port ${PORT}`));
