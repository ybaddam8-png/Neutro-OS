// ============================================================
// ZUSTAND STORE — NeuroAdaptive Modules
// Integration note: merge these slices into your main Zustand store
// or import this store and use it as a sub-store via context
// ============================================================
import { create } from "zustand";
import type {
  SoundSource,
  PRComment,
  PullRequest,
  ActiveModule,
  AcousticState,
  RSDState,
} from "../types";

// ── Acoustic Store ────────────────────────────────────────────
interface AcousticSlice extends AcousticState {
  addSource: (source: Omit<SoundSource, "id">) => void;
  updateSource: (id: string, updates: Partial<SoundSource>) => void;
  removeSource: (id: string) => void;
  setMasterGain: (gain: number) => void;
  setProcessing: (val: boolean) => void;
  setAudioContextReady: (val: boolean) => void;
}

// ── RSD Store ─────────────────────────────────────────────────
interface RSDSlice extends RSDState {
  setPRs: (prs: PullRequest[]) => void;
  addComment: (comment: PRComment) => void;
  markRead: (commentId: string) => void;
  selectPR: (id: string | null) => void;
  setConnected: (val: boolean) => void;
}

// ── Global ────────────────────────────────────────────────────
interface GlobalSlice {
  activeModule: ActiveModule;
  cognitiveLoad: number;
  setActiveModule: (m: ActiveModule) => void;
  setCognitiveLoad: (n: number) => void;
}

type Store = AcousticSlice & RSDSlice & GlobalSlice;

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<Store>((set, get) => ({
  // ── Acoustic ──
  sources: [],
  masterGain: 0.7,
  isProcessing: false,
  audioContextReady: false,

  addSource: (source) =>
    set((s) => ({ sources: [...s.sources, { ...source, id: generateId() }] })),

  updateSource: (id, updates) =>
    set((s) => ({
      sources: s.sources.map((src) =>
        src.id === id ? { ...src, ...updates } : src
      ),
    })),

  removeSource: (id) =>
    set((s) => ({ sources: s.sources.filter((src) => src.id !== id) })),

  setMasterGain: (masterGain) => set({ masterGain }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setAudioContextReady: (audioContextReady) => set({ audioContextReady }),

  // ── RSD ──
  prs: [],
  comments: [],
  selectedPRId: null,
  isConnected: false,
  webhookSecret: "",

  setPRs: (prs) => set({ prs }),
  addComment: (comment) =>
    set((s) => ({ comments: [comment, ...s.comments] })),
  markRead: (commentId) =>
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, isRead: true } : c
      ),
    })),
  selectPR: (selectedPRId) => set({ selectedPRId }),
  setConnected: (isConnected) => set({ isConnected }),

  // ── Global ──
  activeModule: null,
  cognitiveLoad: 0,
  setActiveModule: (activeModule) => set({ activeModule }),
  setCognitiveLoad: (cognitiveLoad) => set({ cognitiveLoad }),
}));
