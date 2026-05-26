import { motion } from "motion/react";
import { ShieldCheck, Cpu, Code2, Users2, Activity } from "lucide-react";

export default function AboutMD() {
  const cards = [
    {
      icon: Users2,
      title: "80-Year Foundation",
      desc: "N.K. Thomas established N.K.T. Vessels House in 1947, earning a lasting family reputation for premium kitchenware and golden customer care."
    },
    {
      icon: Cpu,
      title: "Modern Utilities",
      desc: "Upgrading Nedumpurath Towers with high-capacity green power resources, including low-cost 90kW DC fast EV charging for local travelers."
    },
    {
      icon: Code2,
      title: "Caring Support",
      desc: "Offering convenient online support channels to respond to tenant inquiries and guest questions with polite and friendly service."
    }
  ];

  return (
    <section className="relative py-20 bg-slate-950/40 border-t border-b border-white/5 overflow-hidden">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-white/10 text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono tracking-wider uppercase">OUR HERITAGE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              Honoring an 80-Year Lineage,{" "}
              <span className="text-cyan-400">Embracing Modern Convenience</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Our business ancestry began in the heart of Thodupuzha in **1947** when our founder, **N.K. Thomas**, opened the ground-floor doors of **N.K.T. Vessels House**. Over eight decades, this store has become a household name, respected for its brass, copper, and stainless steel utensils, and partner appliances from iconic brands like Prestige and Preethi.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Today, Managing Director **George S. Thomas** is focused on serving the next generation—modernizing this physical footprint cleanly. By combining historical integrity with simple, reliable digital assistance, the NKT Group delivers smooth rent management, fast EV grid access, and accessible communication for all visitors.
            </p>

            <div className="grid grid-cols-2 gap-4.5 pt-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-3xl font-bold text-white font-mono">1947</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Founded by N.K. Thomas</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-3xl font-bold text-cyan-400 font-mono">90kW</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">DC Fast EV Charging</div>
              </div>
            </div>
          </div>

          {/* Core Foundations Grid */}
          <div className="lg:col-span-5 space-y-4">
            {cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 shadow-lg flex gap-4 items-start"
                >
                  <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-sans font-bold text-white mb-1.5">{card.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
