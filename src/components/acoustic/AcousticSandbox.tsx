// ============================================================
// COMPONENT — AcousticSandbox
// Module 2: Acoustic Phase-Inversion Sandbox
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../store";
import { useAcousticEngine } from "../../hooks/useAcousticEngine";
import type { SoundSource } from "../../types";

const SOURCE_PRESETS: Omit<SoundSource, "id" | "x" | "y" | "isActive">[] = [
  { type: "ac", label: "Humming AC", frequency: 120, gain: 0.7, icon: "❄️", color: "#60a5fa" },
  { type: "chatter", label: "Coworkers", frequency: 800, gain: 0.6, icon: "💬", color: "#f59e0b" },
  { type: "traffic", label: "Traffic", frequency: 250, gain: 0.5, icon: "🚗", color: "#6b7280" },
  { type: "keyboard", label: "Keyboards", frequency: 1200, gain: 0.4, icon: "⌨️", color: "#a78bfa" },
  { type: "music", label: "Background Music", frequency: 440, gain: 0.45, icon: "🎵", color: "#10b981" },
  { type: "custom", label: "Custom Noise", frequency: 500, gain: 0.5, icon: "〰️", color: "#f472b6" },
];

const FREQ_LABELS: Record<number, string> = {
  60: "60Hz – Deep hum",
  120: "120Hz – AC units",
  250: "250Hz – Traffic",
  440: "440Hz – Musical A",
  800: "800Hz – Speech",
  1200: "1.2kHz – Keyboards",
  2000: "2kHz – High speech",
  4000: "4kHz – Sibilance",
};

export function AcousticSandbox() {
  const {
    sources, masterGain, isProcessing, audioContextReady,
    addSource, updateSource, removeSource, setMasterGain,
  } = useStore();
  const { initAudio, stopAudio } = useAcousticEngine();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const STAGE_W = 560;
  const STAGE_H = 320;

  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const presetType = e.dataTransfer.getData("preset");
    const preset = SOURCE_PRESETS.find((p) => p.type === presetType);
    if (preset) {
      addSource({ ...preset, x, y, isActive: true });
    }
  };

  const handleSourceDrag = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingId(id);
    const stage = document.getElementById("soundstage");
    if (!stage) return;
    const rect = stage.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      updateSource(id, { x, y });
    };
    const onUp = () => {
      setDraggingId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const getDirectionLabel = (x: number) => {
    if (x < 0.33) return "← Left";
    if (x > 0.67) return "Right →";
    return "Center";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#080d1a" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
        background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          ◎ ACOUSTIC SANDBOX
        </div>
        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Master</span>
          <input
            type="range" min={0} max={1} step={0.01} value={masterGain}
            onChange={(e) => setMasterGain(parseFloat(e.target.value))}
            style={{ width: 80, accentColor: "#60a5fa" }}
          />
          <span style={{ color: "#60a5fa", fontSize: 12, width: 32 }}>
            {Math.round(masterGain * 100)}%
          </span>
        </div>

        <button onClick={() => setShowPresets(!showPresets)} style={btnStyle("#1d4ed8")}>
          + Add Source
        </button>

        {audioContextReady ? (
          <button onClick={stopAudio} style={btnStyle("#dc2626")}>
            ■ Stop Processing
          </button>
        ) : (
          <button onClick={initAudio} style={btnStyle("#16a34a")}>
            ▶ Start Mic Filter
          </button>
        )}

        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isProcessing ? "#22c55e" : "rgba(255,255,255,0.15)",
          boxShadow: isProcessing ? "0 0 8px #22c55e" : "none",
          animation: isProcessing ? "pulse 1.5s ease infinite" : "none",
        }} />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sound Stage */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 12, letterSpacing: 2 }}>
            DRAG SOURCES ONTO THE SOUNDSTAGE · LEFT ← YOU → RIGHT
          </div>

          <div
            id="soundstage"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleStageDrop}
            style={{
              width: STAGE_W, height: STAGE_H, position: "relative",
              borderRadius: 20,
              background: "radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, rgba(8,13,26,0.8) 70%)",
              border: "1px solid rgba(96,165,250,0.2)",
              boxShadow: "inset 0 0 60px rgba(37,99,235,0.1), 0 0 40px rgba(37,99,235,0.05)",
              overflow: "hidden",
            }}
          >
            {/* Soundstage rings */}
            {[0.3, 0.6, 1].map((s) => (
              <div key={s} style={{
                position: "absolute", inset: 0,
                border: "1px solid rgba(96,165,250,0.08)",
                borderRadius: 20,
                transform: `scale(${s})`,
                transformOrigin: "center",
                pointerEvents: "none",
              }} />
            ))}

            {/* You marker */}
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(96,165,250,0.15)",
              border: "2px solid rgba(96,165,250,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, pointerEvents: "none", zIndex: 10,
            }}>
              🧠
            </div>

            {/* Direction labels */}
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>◀ LEFT</div>
            <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>RIGHT ▶</div>

            {/* Source icons */}
            {sources.map((src) => (
              <motion.div
                key={src.id}
                animate={{ x: src.x * STAGE_W, y: src.y * STAGE_H }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{
                  position: "absolute",
                  left: 0, top: 0,
                  width: 52, height: 52,
                  marginLeft: -26, marginTop: -26,
                  cursor: draggingId === src.id ? "grabbing" : "grab",
                  zIndex: draggingId === src.id ? 50 : 20,
                }}
                onMouseDown={(e) => handleSourceDrag(src.id, e)}
              >
                <div style={{
                  width: "100%", height: "100%",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${src.color}33, ${src.color}11)`,
                  border: `2px solid ${src.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                  boxShadow: src.isActive
                    ? `0 0 ${20 * src.gain}px ${src.color}66`
                    : "none",
                  opacity: src.isActive ? 1 : 0.4,
                  position: "relative",
                }}>
                  {src.icon}
                  {/* Ripple when active */}
                  {src.isActive && (
                    <div style={{
                      position: "absolute", inset: -8, borderRadius: "50%",
                      border: `1px solid ${src.color}44`,
                      animation: "ripple 2s ease infinite",
                    }} />
                  )}
                </div>
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: "50%",
                  transform: "translateX(-50%)", whiteSpace: "nowrap",
                  fontSize: 9, color: src.color, fontWeight: 600, letterSpacing: 0.5,
                }}>
                  {src.label}
                </div>
              </motion.div>
            ))}

            {sources.length === 0 && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.15)", fontSize: 13, pointerEvents: "none",
                flexDirection: "column", gap: 8,
              }}>
                <div style={{ fontSize: 32 }}>🎧</div>
                <div>Add noise sources from the panel →</div>
              </div>
            )}
          </div>

          {!audioContextReady && (
            <div style={{
              marginTop: 16, padding: "10px 20px", borderRadius: 10,
              background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
              color: "#fbbf24", fontSize: 12, maxWidth: STAGE_W, textAlign: "center",
            }}>
              ⚠️ Demo mode — click "Start Mic Filter" to enable real microphone phase-inversion processing.
              Positions are visual in demo; audio filtering requires mic permission.
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{
          width: 300, borderLeft: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)", padding: 20, overflowY: "auto", flexShrink: 0,
        }}>
          {/* Preset Picker */}
          <AnimatePresence>
            {showPresets && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>
                  DRAG TO SOUNDSTAGE
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {SOURCE_PRESETS.map((preset) => (
                    <div
                      key={preset.type}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("preset", preset.type)}
                      onClick={() => addSource({ ...preset, x: 0.5, y: 0.5, isActive: true })}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${preset.color}33`,
                        cursor: "grab", transition: "background 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{preset.icon}</span>
                      <div>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{preset.label}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{preset.frequency}Hz center frequency</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Sources */}
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>
            ACTIVE SOURCES ({sources.length})
          </div>

          {sources.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
              No sources added yet
            </div>
          )}

          {sources.map((src) => (
            <motion.div
              key={src.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                border: `1px solid ${src.color}22`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{src.icon}</span>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, flex: 1 }}>{src.label}</span>
                <button
                  onClick={() => updateSource(src.id, { isActive: !src.isActive })}
                  style={{
                    ...btnStyle(src.isActive ? src.color : "#374151"),
                    padding: "3px 10px", fontSize: 11,
                  }}
                >
                  {src.isActive ? "ON" : "OFF"}
                </button>
                <button
                  onClick={() => removeSource(src.id)}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Suppression</span>
                    <span style={{ color: src.color, fontSize: 11 }}>{Math.round(src.gain * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={src.gain}
                    onChange={(e) => updateSource(src.id, { gain: parseFloat(e.target.value) })}
                    style={{ width: "100%", accentColor: src.color }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Frequency</span>
                    <span style={{ color: src.color, fontSize: 11 }}>{src.frequency}Hz</span>
                  </div>
                  <input type="range" min={60} max={4000} step={10} value={src.frequency}
                    onChange={(e) => updateSource(src.id, { frequency: parseFloat(e.target.value) })}
                    style={{ width: "100%", accentColor: src.color }}
                  />
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 2 }}>
                    {FREQ_LABELS[Object.keys(FREQ_LABELS).reduce((a, b) =>
                      Math.abs(parseInt(b) - src.frequency) < Math.abs(parseInt(a) - src.frequency) ? b : a
                    )] || `${src.frequency}Hz`}
                  </div>
                </div>

                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                  Position: {getDirectionLabel(src.x)} · {Math.round(src.y * 100)}% depth
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function getDirectionLabel(x: number) {
  if (x < 0.33) return "← Left";
  if (x > 0.67) return "Right →";
  return "Center";
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
