// ============================================================
// SHARED TYPES — NeuroAdaptive Modules
// Drop this file into your main project's src/types/ directory
// ============================================================

// ── Canvas Module ────────────────────────────────────────────
export interface TextBlock {
  id: string;
  content: string;
  x: number;
  y: number;
  z: number; // depth layer for 3D parallax
  width: number;
  fontSize: number;
  fontFamily: string;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  backgroundColor: string;
  isSelected: boolean;
  velocity: { x: number; y: number };
  isDragging: boolean;
  type: "paragraph" | "heading" | "sentence" | "note";
  createdAt: number;
}

export interface CanvasState {
  blocks: TextBlock[];
  pan: { x: number; y: number };
  zoom: number;
  selectedId: string | null;
  isDyslexicMode: boolean;
}

// ── Acoustic Module ──────────────────────────────────────────
export interface SoundSource {
  id: string;
  type: "ac" | "chatter" | "traffic" | "keyboard" | "music" | "custom";
  label: string;
  x: number; // 0–1 normalized position on soundstage
  y: number;
  frequency: number; // Hz center frequency to attenuate
  gain: number; // 0–1 suppression intensity
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

// ── RSD Shield Module ────────────────────────────────────────
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
  safetyScore: number; // 0–100 how RSD-safe the review is after sanitization
}

export interface RSDState {
  prs: PullRequest[];
  comments: PRComment[];
  selectedPRId: string | null;
  isConnected: boolean;
  webhookSecret: string;
}

// ── Global App State ─────────────────────────────────────────
export type ActiveModule = "canvas" | "acoustic" | "rsd" | null;

export interface AppState {
  activeModule: ActiveModule;
  cognitiveLoad: number; // 0–100, fed from main project biometrics
  theme: "dark" | "light";
}
