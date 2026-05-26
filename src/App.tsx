import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Hero from "./components/Hero";
import AboutMD from "./components/AboutMD";
import Ventures from "./components/Ventures";
import MediaHub from "./components/MediaHub";
import ContactForm from "./components/ContactForm";
import AdminPanel from "./components/AdminPanel";
import AiBot from "./components/AiBot";
import { Building2, Terminal, ShieldAlert, Sparkles, LogIn, ChevronRight, Compass } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"public" | "admin">("public");

  useEffect(() => {
    // Scroll to top on view changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col font-sans relative">
      
      {/* Absolute Noise Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Modern Fixed Header */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <button
            onClick={() => setCurrentView("public")}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
              <Building2 className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
            </div>
            <div>
              <span className="text-sm font-sans font-black tracking-tight text-white block">NKT GROUP</span>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 block">THODUPUZHA // KERALA</span>
            </div>
          </button>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {currentView === "public" ? (
              <button
                id="btn-nav-admin"
                onClick={() => setCurrentView("admin")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/15 hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 font-semibold cursor-pointer text-xs uppercase tracking-wide transition-all"
              >
                <LogIn className="w-4 h-4" />
                Manager Login
              </button>
            ) : (
              <button
                id="btn-nav-public"
                onClick={() => setCurrentView("public")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/15 cursor-pointer text-xs uppercase tracking-wide transition-all"
              >
                <Compass className="w-4 h-4" />
                Return to Showcase
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Dynamic View Panels */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-0 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentView === "public" ? (
            <motion.div
              key="public-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-0"
            >
              <Hero
                onExploreClick={() => {
                  const element = document.getElementById("ventures-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                onContactClick={() => {
                  const element = document.getElementById("contact-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              
              <div id="about-section">
                <AboutMD />
              </div>

              <div id="ventures-section" className="scroll-mt-16">
                <Ventures />
              </div>

              <div id="media-section">
                <MediaHub />
              </div>

              <div id="contact-section" className="scroll-mt-16">
                <ContactForm />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Interactive Virtual Assistant */}
      {currentView === "public" && <AiBot />}

      {/* Elegant Architectural Footer */}
      <footer className="border-t border-white/5 bg-slate-950/40 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 text-slate-500">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-sans text-slate-300 font-bold uppercase tracking-wider">NKT Group Legacy Division</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">Founders: N.K. Thomas (est. 1947) | George S. Thomas (MD)</p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1 font-mono text-[10px] text-slate-600">
            <div>Nedumpurath Towers, Idukki Rd, opposite Josco, Thodupuzha</div>
            <div>Traditional Heritage // Modern Utilities</div>
            <div className="text-[9px] text-cyan-500/80 mt-1">© {new Date().getFullYear()} NKT Group. All rights reserved.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
