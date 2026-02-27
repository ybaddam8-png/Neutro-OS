// ============================================================
// LIB — Gemini / LangChain helpers
// ============================================================

// RSD Shield: De-weaponize a PR review comment
export async function sanitizePRComment(
  rawComment: string,
  apiKey: string
): Promise<{ sanitized: string; actionItems: string[]; sentiment: string }> {
  const PROMPT = `You are the RSD Shield, an AI that helps neurodivergent software engineers by rewriting code review comments.

Your task:
1. Remove ALL sarcasm, passive-aggressiveness, condescension, and bluntness
2. Preserve 100% of the technical content and required changes
3. Reframe criticism as collaborative problem-solving
4. Extract specific actionable items as a bulleted list
5. Classify sentiment: "critical" | "neutral" | "positive" | "mixed"

INPUT COMMENT:
${rawComment}

Respond ONLY with valid JSON, no markdown fences:
{
  "sanitized": "rewritten comment text here",
  "actionItems": ["action 1", "action 2"],
  "sentiment": "critical"
}`;

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
      })
    });
    
    // Check for HTTP errors
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    // Ensure we have valid data
    return {
      sanitized: result.sanitized || rawComment,
      actionItems: result.actionItems || [],
      sentiment: result.sentiment || "neutral"
    };
  } catch (err) {
    // Use intelligent fallback that extracts context-specific action items
    return buildFallbackSanitization(rawComment);
  }
}

// Fallback when API fails — extract meaningful action items from text
function buildFallbackSanitization(raw: string): { sanitized: string; actionItems: string[]; sentiment: string } {
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
