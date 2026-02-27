// ============================================================
// COMPONENT — RSDShield
// Module 3: GitHub PR "RSD Shield" Safe PR Viewer
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../store";
import { sanitizePRComment } from "../../lib/gemini";
import type { PRComment, PullRequest, ReviewSentiment } from "../../types";

// ── Mock data for demo without GitHub OAuth ──
const MOCK_PRS: PullRequest[] = [
  {
    id: "pr-1", number: 247, title: "Add user authentication flow",
    repo: "acme/frontend", state: "open", commentCount: 4, unreadCount: 3,
    lastActivity: "2 hours ago", safetyScore: 88,
  },
  {
    id: "pr-2", number: 201, title: "Refactor database connection pooling",
    repo: "acme/backend", state: "open", commentCount: 7, unreadCount: 5,
    lastActivity: "5 hours ago", safetyScore: 72,
  },
  {
    id: "pr-3", number: 189, title: "Fix memory leak in WebSocket handler",
    repo: "acme/backend", state: "open", commentCount: 2, unreadCount: 1,
    lastActivity: "1 day ago", safetyScore: 95,
  },
];

const RAW_MOCK_COMMENTS: Array<{ prId: string; raw: string; author: string; file?: string; line?: number }> = [
  {
    prId: "pr-1", author: "senior_dev_bob",
    raw: "This is obviously wrong. Did you even test this? The authentication flow completely breaks on mobile. Also, why would you put business logic in the component? That's a rookie mistake. This needs to be completely rewritten.",
    file: "src/auth/LoginForm.tsx", line: 42,
  },
  {
    prId: "pr-1", author: "tech_lead_sarah",
    raw: "I'm not sure how you missed this, but there's a clear race condition here. It's basic async/await. Also the variable names are confusing and frankly unprofessional.",
    file: "src/hooks/useAuth.ts", line: 18,
  },
  {
    prId: "pr-1", author: "teammate_alex",
    raw: "Hey, looks mostly good! Just a minor nitpick — the error handling on line 67 might not catch network failures. Could be worth adding a try/catch there. Great work overall! 🎉",
    file: "src/auth/authService.ts", line: 67,
  },
  {
    prId: "pr-2", author: "dba_mike",
    raw: "This is NOT how connection pooling works. You're going to cause serious performance issues in prod. I can't believe this was approved for review. The whole approach needs to change.",
    file: "src/db/pool.ts", line: 12,
  },
  {
    prId: "pr-2", author: "senior_dev_bob",
    raw: "Why is there duplicate logic here? This violates DRY principles which I would expect you to know by now.",
    file: "src/db/queries.ts", line: 89,
  },
];

const SENTIMENT_COLORS: Record<ReviewSentiment, string> = {
  critical: "#ef4444",
  neutral: "#6b7280",
  positive: "#22c55e",
  mixed: "#f59e0b",
};

const SENTIMENT_LABELS: Record<ReviewSentiment, string> = {
  critical: "🔴 Critical",
  neutral: "⚪ Neutral",
  positive: "🟢 Positive",
  mixed: "🟡 Mixed",
};

export function RSDShield() {
  const { prs, comments, selectedPRId, isConnected, setPRs, addComment, markRead, selectPR, setConnected } = useStore();
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || "");
  const [webhookUrl] = useState(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/webhooks/github`);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const selectedPR = prs.find((p) => p.id === selectedPRId);
  const prComments = comments.filter((c) => c.prId === selectedPRId);
  const unreadTotal = prs.reduce((acc, p) => acc + p.unreadCount, 0);

  const loadDemoData = async () => {
    try {
      setIsLoading(true);
      setPRs(MOCK_PRS);

      for (const raw of RAW_MOCK_COMMENTS) {
        let result = {
          sanitized: raw.raw,
          actionItems: ["Review the comment carefully"],
          sentiment: "neutral" as ReviewSentiment,
        };

        if (apiKey) {
          try {
            const r = await sanitizePRComment(raw.raw, apiKey);
            result = { ...r, sentiment: r.sentiment as ReviewSentiment };
          } catch { /* fallback */ }
        } else {
          // Demo fallback — simple rewrite without API
          result = buildFallbackSanitization(raw.raw);
        }

        addComment({
          id: Math.random().toString(36).slice(2),
          prId: raw.prId,
          prTitle: MOCK_PRS.find((p) => p.id === raw.prId)?.title || "",
          originalText: raw.raw,
          sanitizedText: result.sanitized || raw.raw,
          author: raw.author,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${raw.author}`,
          filePath: raw.file,
          lineNumber: raw.line,
          sentiment: result.sentiment,
          actionItems: result.actionItems || [],
          createdAt: new Date().toISOString(),
          isRead: false,
          githubCommentId: Math.floor(Math.random() * 99999),
        });
      }

      setIsLoading(false);
      setDemoLoaded(true);
      selectPR("pr-1");
    } catch (err) {
      console.error('[RSD Shield] Error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0c0f1a" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
        background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        <div style={{ color: "#f472b6", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          🛡 RSD SHIELD
        </div>

        {unreadTotal > 0 && (
          <div style={{
            background: "#ef4444", color: "#fff", borderRadius: 20,
            fontSize: 11, fontWeight: 700, padding: "2px 8px",
          }}>
            {unreadTotal} new
          </div>
        )}

        <div style={{ flex: 1 }} />

        {!demoLoaded ? (
          <>
            {!import.meta.env.VITE_GEMINI_API_KEY && (
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Gemini API Key (optional)"
                style={{
                  padding: "6px 12px", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  color: "#fff", fontSize: 12, width: 220,
                }}
              />
            )}
            <button onClick={loadDemoData} disabled={isLoading} style={btnStyle("#6366f1")}>
              {isLoading ? "Loading…" : "Load Demo PRs"}
            </button>
          </>
        ) : (
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            Webhook: <code style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{webhookUrl}</code>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* PR List sidebar */}
        <div style={{
          width: 260, borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)", overflowY: "auto", flexShrink: 0,
        }}>
          <div style={{ padding: "12px 16px", color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 2 }}>
            PULL REQUESTS
          </div>

          {prs.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
              <div>No PRs loaded yet.</div>
              <div style={{ fontSize: 11, marginTop: 8 }}>Click "Load Demo PRs" to see the RSD Shield in action</div>
            </div>
          )}

          {prs.map((pr) => {
            const isSelected = pr.id === selectedPRId;
            return (
              <motion.div
                key={pr.id}
                whileHover={{ background: "rgba(255,255,255,0.06)" }}
                onClick={() => selectPR(pr.id)}
                style={{
                  padding: "14px 16px",
                  borderLeft: isSelected ? "3px solid #f472b6" : "3px solid transparent",
                  background: isSelected ? "rgba(244,114,182,0.08)" : "transparent",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>#{pr.number}</span>
                  {pr.unreadCount > 0 && (
                    <span style={{
                      background: "#f472b6", color: "#fff", borderRadius: 10,
                      fontSize: 10, fontWeight: 700, padding: "1px 6px",
                    }}>
                      {pr.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>
                  {pr.title}
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 6 }}>{pr.repo}</div>

                {/* Safety score */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${pr.safetyScore}%`,
                      background: pr.safetyScore > 80 ? "#22c55e" : pr.safetyScore > 60 ? "#f59e0b" : "#ef4444",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{pr.safetyScore}%</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 2 }}>RSD Safety Score</div>
              </motion.div>
            );
          })}
        </div>

        {/* Comment viewer */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {!selectedPR ? (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.2)", gap: 16,
            }}>
              <div style={{ fontSize: 64 }}>🛡️</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>RSD Shield Active</div>
              <div style={{ fontSize: 14, maxWidth: 400, textAlign: "center", lineHeight: 1.7 }}>
                All PR review comments are intercepted and de-weaponized before you see them.
                No sarcasm, no condescension — only clear, actionable feedback.
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
                  {selectedPR.title}
                </h2>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  {selectedPR.repo} · #{selectedPR.number} · {selectedPR.commentCount} comments
                </div>
              </div>

              <AnimatePresence>
                {prComments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginBottom: 16,
                      background: comment.isRead ? "rgba(255,255,255,0.03)" : "rgba(244,114,182,0.05)",
                      borderRadius: 16,
                      border: comment.isRead
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(244,114,182,0.2)",
                      padding: 20,
                    }}
                  >
                    {/* Comment header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <img
                        src={comment.avatarUrl}
                        alt={comment.author}
                        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{comment.author}</div>
                        {comment.filePath && (
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                            {comment.filePath}{comment.lineNumber ? `:${comment.lineNumber}` : ""}
                          </div>
                        )}
                      </div>
                      <div style={{
                        color: SENTIMENT_COLORS[comment.sentiment],
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {SENTIMENT_LABELS[comment.sentiment]}
                      </div>
                      {!comment.isRead && (
                        <button
                          onClick={() => markRead(comment.id)}
                          style={{ ...btnStyle("#374151"), fontSize: 11, padding: "4px 10px" }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>

                    {/* Sanitized comment */}
                    <div style={{
                      background: "rgba(34,197,94,0.05)",
                      border: "1px solid rgba(34,197,94,0.15)",
                      borderRadius: 12, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ color: "#22c55e", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>
                        🛡️ SHIELD-PROCESSED · EMOTIONALLY NEUTRAL
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                        {comment.sanitizedText}
                      </p>
                    </div>

                    {/* Action items */}
                    {(comment.actionItems?.length ?? 0) > 0 && (
                      <div style={{
                        background: "rgba(99,102,241,0.06)",
                        border: "1px solid rgba(99,102,241,0.15)",
                        borderRadius: 10, padding: 14, marginBottom: 12,
                      }}>
                        <div style={{ color: "#818cf8", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>
                          ✅ ACTION ITEMS
                        </div>
                        {comment.actionItems?.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                            <span style={{ color: "#818cf8", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toggle original */}
                    <button
                      onClick={() => setShowOriginal((s) => ({ ...s, [comment.id]: !s[comment.id] }))}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer", padding: 0 }}
                    >
                      {showOriginal[comment.id] ? "▲ Hide original" : "▼ Show original (may be distressing)"}
                    </button>

                    <AnimatePresence>
                      {showOriginal[comment.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{
                            marginTop: 10,
                            background: "rgba(239,68,68,0.05)",
                            border: "1px solid rgba(239,68,68,0.15)",
                            borderRadius: 10, padding: 14,
                          }}>
                            <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>
                              ⚠️ ORIGINAL — UNPROCESSED
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                              {comment.originalText}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {prComments.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
                  No comments on this PR yet
                </div>
              )}
            </>
          )}
        </div>

        {/* Webhook setup panel */}
        {demoLoaded && (
          <div style={{
            width: 240, borderLeft: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)", padding: 20, flexShrink: 0,
            overflowY: "auto",
          }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>
              WEBHOOK CONFIG
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
              In your GitHub repo:<br />
              Settings → Webhooks → Add
            </div>
            <div style={{
              background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 10,
              color: "#22c55e", fontSize: 10, fontFamily: "monospace",
              wordBreak: "break-all", marginBottom: 16,
            }}>
              {webhookUrl}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
              Events to listen for:
            </div>
            {["pull_request_review", "pull_request_review_comment", "issue_comment"].map((evt) => (
              <div key={evt} style={{
                color: "#a78bfa", fontSize: 11, fontFamily: "monospace",
                padding: "4px 8px", background: "rgba(167,139,250,0.08)",
                borderRadius: 6, marginBottom: 6,
              }}>
                {evt}
              </div>
            ))}
            <div style={{
              marginTop: 16, padding: 12, background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10,
              color: "#86efac", fontSize: 11, lineHeight: 1.7,
            }}>
              Backend intercepts → Gemini sanitizes → Supabase stores → You see calm, actionable feedback here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback when no API key — extract meaningful action items from text
function buildFallbackSanitization(raw: string): {
  sanitized: string;
  actionItems: string[];
  sentiment: ReviewSentiment;
} {
  const aggressive = ["obviously", "rookie", "can't believe", "never", "wrong", "didn't you", "why would you", "completely", "seriously"];
  const isAggressive = aggressive.some((w) => raw.toLowerCase().includes(w));
  
  // Extract technical terms and issues mentioned
  const technicalPatterns = [
    { pattern: /race condition|async|await|thread/i, action: "Address race condition in async/await handling" },
    { pattern: /mobile|responsive|screen size/i, action: "Test and fix mobile/responsive behavior" },
    { pattern: /business logic|component|separation/i, action: "Move business logic out of UI components" },
    { pattern: /performance|slow|memory leak|pool/i, action: "Investigate and optimize performance issue" },
    { pattern: /duplicate|DRY|repeated/i, action: "Refactor to eliminate duplicate code" },
    { pattern: /variable name|naming|unclear/i, action: "Improve variable naming for clarity" },
    { pattern: /error handling|try.*catch|exception/i, action: "Add proper error handling" },
    { pattern: /authentication|auth|login/i, action: "Review authentication flow implementation" },
    { pattern: /database|db|query|connection/i, action: "Optimize database connection/query logic" },
    { pattern: /websocket|socket|realtime/i, action: "Fix WebSocket/real-time connection issue" },
  ];
  
  // Extract specific action items based on content
  const actionItems: string[] = [];
  
  technicalPatterns.forEach(({ pattern, action }) => {
    if (pattern.test(raw) && !actionItems.includes(action)) {
      actionItems.push(action);
    }
  });
  
  // If no specific patterns matched, extract sentences with technical details
  if (actionItems.length === 0) {
    const sentences = raw.split(/[.!?]+/).filter(Boolean).map((s) => s.trim());
    const technicalSentences = sentences
      .filter((s) => s.length > 15 && /\b(test|fix|add|remove|change|update|implement|refactor|check|review|ensure)\b/i.test(s))
      .slice(0, 2)
      .map((s) => s
        .replace(/you (missed|failed|forgot)/gi, "Address")
        .replace(/you should (have )?known/gi, "Consider")
        .replace(/why (did|would) you/gi, "Evaluate")
        .replace(/this is wrong/gi, "This needs correction")
        .replace(/that's a (rookie|basic)/gi, "This is a")
        .replace(/i can't believe/gi, "Note that")
        .replace(/obviously|clearly|of course/gi, "")
        .replace(/  +/g, " ")
        .trim()
      );
    
    if (technicalSentences.length > 0) {
      actionItems.push(...technicalSentences);
    }
  }
  
  // Always have at least one action item
  if (actionItems.length === 0) {
    actionItems.push("Review technical feedback and address concerns");
  }

  const sanitized = raw
    .replace(/obviously|clearly|of course/gi, "")
    .replace(/you (missed|failed|forgot)/gi, "there's an opportunity to address")
    .replace(/rookie mistake/gi, "common pattern to update")
    .replace(/can't believe/gi, "worth noting that")
    .replace(/why would you/gi, "let's consider why")
    .replace(/completely rewritten/gi, "significantly revised")
    .replace(/did you even test/gi, "this may need testing on")
    .replace(/this is NOT how/gi, "this approach differs from")
    .replace(/  +/g, " ")
    .trim();

  return {
    sanitized: sanitized || raw,
    actionItems: actionItems.slice(0, 3),
    sentiment: isAggressive ? "critical" : "neutral",
  };
}

function btnStyle(bg: string) {
  return {
    background: bg,
    border: "none",
    borderRadius: 8,
    color: "#fff",
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties;
}
