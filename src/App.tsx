// ============================================================
// APP — NeuroAdaptive Modules Hub
// Single application housing all 3 modules
// Integration: export each module component individually
// and import into your main project's routing
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useStore } from "./store";
import { useRSDRealtime } from "./hooks/useRSDRealtime";
import { AcousticSandbox } from "./components/acoustic/AcousticSandbox";
import { RSDShield } from "./components/rsd/RSDShield";
import type { ActiveModule } from "./types";
import { Menu, X, Settings, Activity, Shield } from "lucide-react";

const MODULES: Array<{
  id: ActiveModule;
  label: string;
  subtitle: string;
  icon: any;
  color: string;
  description: string;
  target: string;
}> = [
  {
    id: "acoustic",
    label: "Acoustic Sandbox",
    subtitle: "Phase-Inversion Equalizer",
    icon: Activity,
    color: "#60a5fa",
    description: "Visual soundstage + Web Audio API noise suppression for open-plan environments",
    target: "Autism",
  },
  {
    id: "rsd",
    label: "RSD Shield",
    subtitle: "Safe PR Viewer",
    icon: Shield,
    color: "#f472b6",
    description: "GitHub webhook interceptor — Gemini de-weaponizes code reviews before you see them",
    target: "ADHD / Autism",
  },
];

const Sidebar = ({ isOpen, toggle, activeModule, setActiveModule, cognitiveLoad }: any) => {
  return (
    <>
      <motion.button
        onClick={toggle}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 100,
          background: "rgba(13, 17, 23, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "10px",
          color: "white",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "300px",
              height: "100vh",
              background: "rgba(8, 13, 26, 0.9)",
              backdropFilter: "blur(24px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              zIndex: 90,
              padding: "80px 24px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
              boxShadow: "20px 0 60px rgba(0,0,0,0.6)",
            }}
          >
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "16px", fontWeight: 700 }}>
                Navigation
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {MODULES.map((m) => {
                  const isActive = activeModule === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setActiveModule(m.id); toggle(); }}
                      style={{
                        background: isActive ? `${m.color}18` : "transparent",
                        border: "1px solid",
                        borderColor: isActive ? `${m.color}44` : "transparent",
                        borderRadius: "12px",
                        padding: "14px 18px",
                        color: isActive ? "white" : "rgba(255,255,255,0.45)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        fontSize: "14px",
                        fontWeight: isActive ? 600 : 500,
                        transition: "all 0.25s",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ color: isActive ? m.color : "inherit" }}>
                        <Icon size={20} />
                      </div>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "auto" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "16px", fontWeight: 700 }}>
                System Telemetry
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Cognitive Sync</span>
                  <span style={{ fontSize: "12px", color: cognitiveLoad > 70 ? "#ef4444" : "#22c55e", fontWeight: 700 }}>{cognitiveLoad}%</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <motion.div
                    animate={{ width: `${cognitiveLoad}%` }}
                    style={{
                      height: "100%",
                      background: cognitiveLoad < 40 ? "#22c55e" : cognitiveLoad < 70 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveModule(null)}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "14px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                Return to Hub
              </button>
              
              <div style={{ marginTop: "24px", padding: "0 4px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255,255,255,0.2)" }}>
                <Settings size={20} cursor="pointer" />
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: 1 }}>v2.5.0-STABLE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function App() {
  const { activeModule, setActiveModule, cognitiveLoad } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize RSD Shield Realtime polling
  useRSDRealtime();

  if (activeModule) {
    return (
      <div style={{
        width: "100vw", height: "100vh", position: "relative",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        background: "#020408",
        overflow: "hidden",
      }}>
        {/* Sidebar Overlay */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          cognitiveLoad={cognitiveLoad}
        />

        {/* Content Area - True Full Screen */}
        <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", height: "100%" }}
            >
              {activeModule === "acoustic" && <AcousticSandbox />}
              {activeModule === "rsd" && <RSDShield />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Hub Landing ──────────────────────────────────────────────
  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#06080f",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 40,
      backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(244,114,182,0.05) 0%, transparent 60%)",
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", marginBottom: 60 }}
      >
        <div style={{
          fontSize: 11, letterSpacing: 4, color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase", marginBottom: 16,
        }}>
          NeuroAdaptive Intelligence Infrastructure
        </div>
        <h1 style={{
          fontSize: 42, fontWeight: 800, color: "#fff", margin: "0 0 12px",
          letterSpacing: -1,
        }}>
          Module Hub
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.35)", fontSize: 16, margin: 0, maxWidth: 480, lineHeight: 1.7,
        }}>
          Three standalone cognitive tools, integrated into one application.
          Each module connects seamlessly to your main NeuroAdaptive OS.
        </p>
      </motion.div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", maxWidth: 1000 }}>
        {MODULES.map((module, i) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => setActiveModule(module.id)}
            style={{
              width: 280, cursor: "pointer",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 20, padding: 28,
              transition: "border-color 0.2s, box-shadow 0.2s",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = `${module.color}44`;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${module.color}11`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Background gradient */}
            <div style={{
              position: "absolute", top: 0, right: 0, width: 120, height: 120,
              borderRadius: "0 20px 0 100%",
              background: `radial-gradient(circle, ${module.color}15 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 48, height: 48, borderRadius: 14,
              background: `${module.color}18`,
              border: `1px solid ${module.color}33`,
              fontSize: 22, marginBottom: 20, color: module.color,
            }}>
              {i === 0 ? "⬡" : i === 1 ? "◎" : "🛡"}
            </div>

            <div style={{
              display: "inline-block", marginLeft: 8,
              background: `${module.color}18`,
              border: `1px solid ${module.color}33`,
              color: module.color, borderRadius: 20,
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              padding: "2px 10px", marginBottom: 16, verticalAlign: "middle",
            }}>
              {module.target}
            </div>

            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: -0.3 }}>
              {module.label}
            </h3>
            <div style={{ color: module.color, fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>
              {module.subtitle}
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {module.description}
            </p>

            <div style={{
              marginTop: 24, display: "flex", alignItems: "center",
              color: module.color, fontSize: 13, fontWeight: 600, gap: 4,
            }}>
              Open module <span style={{ marginLeft: "auto" }}>→</span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: 48, color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center" }}
      >
        Integration-ready · Same tech stack as main project · Shared Zustand store · Supabase compatible
      </motion.div>
    </div>
  );
}
