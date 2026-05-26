import { motion } from "motion/react";
import { Zap, Building2, Terminal, ChevronDown } from "lucide-react";

interface HeroProps {
  onExploreClick: () => void;
  onContactClick: () => void;
}

export default function Hero({ onExploreClick, onContactClick }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden px-4">
      {/* Dynamic Futuristic Neon Background Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Modern Label Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 mb-8 font-sans"
        >
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-mono tracking-wider uppercase">80 YEARS OF TRUST // SERVING KERALA</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-sans font-bold text-white tracking-tight leading-[1.1] mb-6 max-w-4xl"
        >
          NKT Group | Welcoming you with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-cyan-200">
            Heritage, Modern Spaces & Smart Utilities
          </span>
        </motion.h1>

        {/* Subheadline Overlay inside a Glassmorphic block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-3xl mb-10 p-6 sm:p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden text-left"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
          
          <h2 className="text-lg sm:text-xl text-slate-100 font-sans font-semibold mb-2.5">
            Managed by George S. Thomas & Family
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Our roots are deep in **Thodupuzha, Kerala**. Since **1947**, NKT has stood for honesty and quality. Today, we are proud to offer premium commercial office rentals at **Nedumpurath Towers**, an eco-friendly **90kW DC dual-gun EV charging station**, and a timeless shopping experience focused on service.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4.5 z-10"
        >
          <button
            id="hero-explore-btn"
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg hover:shadow-cyan-500/25 tracking-wide cursor-pointer flex items-center justify-center gap-2"
          >
            <Building2 className="w-5 h-5 text-slate-900" />
            Explore Ventures
          </button>
          
          <button
            id="hero-connect-btn"
            onClick={onContactClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4.5 h-4.5 text-cyan-400" />
            Connect & Enquire
          </button>
        </motion.div>

        {/* Micro Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-4 flex flex-col items-center text-slate-500 gap-1 hover:text-cyan-400 transition-colors pointer-events-none"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">Scroll Down to Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
