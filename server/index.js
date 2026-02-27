// ============================================================
// SERVER — RSD Shield Webhook Handler
// File: server/index.js
// 
// Integration note: Copy the /api/webhooks/github route into
// your existing main project's server/index.js
// ============================================================
import express from "express";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// ── Config ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL || "http://localhost:5174");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── GitHub Signature Verification ────────────────────────────
function verifyGitHubSignature(req) {
  if (!GITHUB_WEBHOOK_SECRET) return true; // Skip in dev
  const sig = req.headers["x-hub-signature-256"];
  if (!sig) return false;
  const expected = "sha256=" + crypto
    .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// ── Gemini Sanitization ───────────────────────────────────────
async function sanitizeWithGemini(rawComment) {
  const PROMPT = `You are the RSD Shield AI. A neurodivergent software engineer is about to read this GitHub PR review comment. Your job:

1. Remove ALL sarcasm, passive-aggressiveness, condescension, and bluntness
2. Preserve 100% of the technical content and required changes  
3. Reframe criticism as collaborative problem-solving between teammates
4. Extract specific, concrete actionable items
5. Classify sentiment as: "critical" | "neutral" | "positive" | "mixed"

INPUT COMMENT:
"${rawComment}"

Respond ONLY with valid JSON (no markdown fences):
{
  "sanitized": "rewritten comment text",
  "actionItems": ["specific action 1", "specific action 2"],
  "sentiment": "critical",
  "safetyScore": 75
}

safetyScore: 0-100, how emotionally safe is the ORIGINAL comment (100=very safe, 0=extremely harsh)`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  );

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── Supabase Storage ──────────────────────────────────────────
async function storeComment(prData, commentData, sanitized) {
  const { data, error } = await supabase
    .from("rsd_shield_comments")
    .upsert({
      github_comment_id: commentData.id,
      pr_number: prData.number,
      pr_title: prData.title,
      repo: prData.base?.repo?.full_name,
      author: commentData.user?.login,
      avatar_url: commentData.user?.avatar_url,
      file_path: commentData.path,
      line_number: commentData.line,
      original_text: commentData.body,
      sanitized_text: sanitized.sanitized,
      action_items: sanitized.actionItems,
      sentiment: sanitized.sentiment,
      safety_score: sanitized.safetyScore,
      created_at: commentData.created_at,
      is_read: false,
    })
    .select();

  if (error) console.error("Supabase insert error:", error);
  return data;
}

// ── Webhook Endpoint ──────────────────────────────────────────
app.get("/api/webhooks/github", (req, res) => {
  res.status(200).json({
    status: "RSD Shield Webhook Handler is Live",
    method: "GET (Healthy)",
    instructions: "This endpoint is configured to receive POST requests from GitHub webhooks.",
    uptime: process.uptime(),
  });
});

app.post("/api/webhooks/github", async (req, res) => {
  // Verify GitHub signature
  if (!verifyGitHubSignature(req)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  console.log(`[RSD Shield] GitHub event: ${event}`);

  // Handle PR review comments
  if (
    (event === "pull_request_review_comment" || event === "issue_comment") &&
    payload.action === "created"
  ) {
    const rawComment = payload.comment?.body || payload.review?.body;
    if (!rawComment) return res.status(200).json({ status: "no comment body" });

    try {
      // Sanitize with Gemini
      const sanitized = await sanitizeWithGemini(rawComment);

      // Store in Supabase
      const pr = payload.pull_request || { number: payload.issue?.number, title: payload.issue?.title, base: null };
      await storeComment(pr, payload.comment, sanitized);

      console.log(`[RSD Shield] Sanitized comment #${payload.comment?.id} — sentiment: ${sanitized.sentiment}`);
      return res.status(200).json({ status: "processed", sentiment: sanitized.sentiment });
    } catch (err) {
      console.error("[RSD Shield] Sanitization error:", err);
      return res.status(500).json({ error: "Sanitization failed" });
    }
  }

  // Handle PR review submitted (summary comment)
  if (event === "pull_request_review" && payload.action === "submitted") {
    const body = payload.review?.body;
    if (body) {
      try {
        const sanitized = await sanitizeWithGemini(body);
        await storeComment(payload.pull_request, {
          id: payload.review.id,
          user: payload.review.user,
          body,
          created_at: payload.review.submitted_at,
        }, sanitized);
      } catch (err) {
        console.error("[RSD Shield] Review sanitization error:", err);
      }
    }
    return res.status(200).json({ status: "review processed" });
  }

  // All other events — acknowledge
  return res.status(200).json({ status: "acknowledged", event });
});

// ── Get sanitized comments (for frontend polling) ─────────────
app.get("/api/rsd/comments", async (req, res) => {
  const { repo, pr_number } = req.query;
  let query = supabase.from("rsd_shield_comments").select("*").order("created_at", { ascending: false });
  if (repo) query = query.eq("repo", repo);
  if (pr_number) query = query.eq("pr_number", pr_number);

  const { data, error } = await query.limit(50);
  if (error) return res.status(500).json({ error });
  return res.json(data);
});

// ── Mark comment as read ──────────────────────────────────────
app.post("/api/rsd/comments/:id/read", async (req, res) => {
  const { data, error } = await supabase
    .from("rsd_shield_comments")
    .update({ is_read: true })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error });
  return res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`[NeuroAdaptive Modules] Server running on :${PORT}`);
  console.log(`[RSD Shield] Webhook endpoint: POST /api/webhooks/github`);
});
