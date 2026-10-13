import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function summarizeLocally(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Please add some study material first.";
  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
  const selected = sentences.slice(0, Math.min(4, sentences.length));
  return selected.map(s => s.trim()).join(" ");
}

function makeQuizLocally(text) {
  const sentences = (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map(s => s.trim()).filter(s => s.length > 25);
  if (!sentences.length) {
    return [{ question: "What is the main topic of your notes?", options: ["The topic in your notes", "An unrelated topic", "None of the above", "Not enough information"], answer: 0 }];
  }
  return sentences.slice(0, 5).map((sentence, i) => {
    const words = sentence.split(/\s+/);
    const keyword = words.find(w => w.length > 6) || words[Math.min(2, words.length - 1)] || "topic";
    const masked = sentence.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____");
    return {
      question: `Fill in the blank: ${masked}`,
      options: [keyword.replace(/[.,;:!?]$/, ""), "photosynthesis", "database", "compiler"],
      answer: 0,
      note: `Based on sentence ${i + 1} from your material.`
    };
  });
}

async function askOpenAI(text, task) {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: task === "summary"
          ? "Summarize the student's study material in clear, accurate bullet points. Preserve important concepts."
          : "Create 5 multiple-choice quiz questions from the student's study material. Return only valid JSON array. Each item must have question, options (4 strings), answer (zero-based integer), and explanation." },
        { role: "user", content: text }
      ],
      temperature: 0.4
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error (${response.status}): ${detail.slice(0, 250)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/summarize", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (text.length < 10) return res.status(400).json({ error: "Paste at least 10 characters of study material." });
  try {
    const aiResult = await askOpenAI(text, "summary");
    res.json({ summary: aiResult || summarizeLocally(text), mode: aiResult ? "ai" : "demo" });
  } catch (error) {
    res.status(502).json({ error: error.message || "Could not generate summary." });
  }
});

app.post("/api/quiz", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (text.length < 10) return res.status(400).json({ error: "Paste at least 10 characters of study material." });
  try {
    const aiResult = await askOpenAI(text, "quiz");
    if (aiResult) {
      const clean = aiResult.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const quiz = JSON.parse(clean);
      return res.json({ quiz, mode: "ai" });
    }
    res.json({ quiz: makeQuizLocally(text), mode: "demo" });
  } catch (error) {
    res.status(502).json({ error: error.message || "Could not generate quiz." });
  }
});

// Serve the built frontend in production.
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`StudyMate AI server running at http://localhost:${PORT}`));