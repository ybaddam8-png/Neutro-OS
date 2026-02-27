// ── Acoustic Module ───────────────────────────────────────────
export interface SoundSource {
  id: string;
  type: "ac" | "chatter" | "traffic" | "keyboard" | "music" | "custom";
  label: string;
  x: number;
  y: number;
  frequency: number;
  gain: number;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface AcousticState {
  sources: SoundSource[];
  masterGain: number;
  isProcessing: boolean;
  audioContextReady: boolean;
}

// ── RSD Shield Module ─────────────────────────────────────────
export type ReviewSentiment = "critical" | "neutral" | "positive" | "mixed";

export interface PRComment {
  id: string;
  prId: string;
  prTitle: string;
  originalText: string;
  sanitizedText: string;
  author: string;
  avatarUrl: string;
  filePath?: string;
  lineNumber?: number;
  sentiment: ReviewSentiment;
  actionItems: string[];
  createdAt: string;
  isRead: boolean;
  githubCommentId: number;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  repo: string;
  state: "open" | "closed" | "merged";
  commentCount: number;
  unreadCount: number;
  lastActivity: string;
  safetyScore: number;
}

export interface RSDState {
  prs: PullRequest[];
  comments: PRComment[];
  selectedPRId: string | null;
  isConnected: boolean;
  webhookSecret: string;
}

// ── Global ────────────────────────────────────────────────────
export type ActiveModule = "acoustic" | "rsd" | null;

export interface AppState {
  activeModule: ActiveModule;
  cognitiveLoad: number;
  theme: "dark" | "light";
}