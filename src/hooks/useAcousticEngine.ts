// ============================================================
// HOOK — useAcousticEngine
// Manages Web Audio API context and per-source BiquadFilter nodes
// ============================================================
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store";

interface FilterNode {
  filter: BiquadFilterNode;
  gain: GainNode;
}

export function useAcousticEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterMapRef = useRef<Map<string, FilterNode>>(new Map());
  const destRef = useRef<AudioNode | null>(null);

  const { sources, masterGain, setProcessing, setAudioContextReady } = useStore();

  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const micSource = ctx.createMediaStreamSource(stream);
      const masterGainNode = ctx.createGain();
      masterGainNode.gain.value = masterGain;
      micSource.connect(masterGainNode);
      masterGainNode.connect(ctx.destination);

      audioCtxRef.current = ctx;
      streamRef.current = stream;
      sourceRef.current = micSource;
      masterGainRef.current = masterGainNode;
      destRef.current = masterGainNode;

      setAudioContextReady(true);
      setProcessing(true);
    } catch (err) {
      console.warn("Acoustic engine: mic access denied, running in demo mode", err);
      setAudioContextReady(false);
    }
  }, []);

  // Sync filters whenever sources change
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const activeIds = new Set(sources.map((s) => s.id));

    // Remove stale filters
    filterMapRef.current.forEach((nodes, id) => {
      if (!activeIds.has(id)) {
        nodes.filter.disconnect();
        nodes.gain.disconnect();
        filterMapRef.current.delete(id);
      }
    });

    // Add / update filters
    sources.forEach((src) => {
      if (!src.isActive) {
        // Bypass: remove if exists
        if (filterMapRef.current.has(src.id)) {
          const n = filterMapRef.current.get(src.id)!;
          n.filter.disconnect();
          n.gain.disconnect();
          filterMapRef.current.delete(src.id);
        }
        return;
      }

      if (!filterMapRef.current.has(src.id)) {
        // Create notch filter for this source
        const filter = ctx.createBiquadFilter();
        filter.type = "notch";
        filter.Q.value = 1.5;
        const gainNode = ctx.createGain();

        // Spatial panning: use the x position (0=left, 1=right) — demo only, 
        // real implementation would use PannerNode
        filter.frequency.value = src.frequency;
        filter.gain.value = -24 * src.gain; // notch depth

        gainNode.gain.value = 1 - src.gain * 0.4;

        sourceRef.current?.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(master);
        filterMapRef.current.set(src.id, { filter, gain: gainNode });
      } else {
        // Update existing
        const n = filterMapRef.current.get(src.id)!;
        n.filter.frequency.setTargetAtTime(src.frequency, ctx.currentTime, 0.05);
        n.gain.gain.setTargetAtTime(1 - src.gain * 0.4, ctx.currentTime, 0.05);
      }
    });
  }, [sources]);

  // Master gain sync
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        masterGain,
        audioCtxRef.current.currentTime,
        0.1
      );
    }
  }, [masterGain]);

  const stopAudio = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    setProcessing(false);
    setAudioContextReady(false);
  }, []);

  return { initAudio, stopAudio };
}
