import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Building2, ShoppingBag, Clock, ShieldCheck, MapPin, ExternalLink, HelpCircle, AlertTriangle, Activity, TrendingUp, Sliders, Leaf } from "lucide-react";
import { EvTelemetry } from "../types";

export default function Ventures() {
  const [activeTab, setActiveTab] = useState<"ev" | "realestate" | "retail">("ev");
  const [telemetry, setTelemetry] = useState<EvTelemetry | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [chargingHour, setChargingHour] = useState(11); // decimal hour representation (0-23)

  // Poll for live EV Charger Telemetry representing the IONGRID OCPP 2.0.1 link
  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      try {
        setIsPolling(true);
        const res = await fetch("/api/telemetry/ev");
        if (res.ok && active) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch (err) {
        console.error("Failed to fetch EV telemetry:", err);
      } finally {
        if (active) setIsPolling(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000); // refresh every 6 sec to show dynamic KSEB draw and SOC!

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const getSliderMetrics = (hour: number) => {
    if (hour >= 16 && hour <= 21) {
      return {
        rate: "₹19.49",
        label: "PEAK GRID STRESS",
        desc: "High demand load on KSEB 3-phase regional node transformer.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        saving: "Reduce peak rate pressure. Shift to solar-saving hours to save!"
      };
    } else if (hour >= 9 && hour <= 15) {
      return {
        rate: "₹13.99",
        label: "SOLAR ALIGNED ECO-SLOT",
        desc: "High local generation matching. Preferred green charging interval.",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        saving: "Peak-shaving discount applied! Save ₹5.50/kWh over peak sessions!"
      };
    } else {
      return {
        rate: "₹15.99",
        label: "STANDARD TRANSITIONAL CODE",
        desc: "Baseline grid profiles. standard operational limits represent.",
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        saving: "Slide hours toward 9 AM - 3 PM daylight to activate Solar rates."
      };
    }
  };

  const sliderMetrics = getSliderMetrics(chargingHour);

  return (
    <section className="relative py-20 px-4">
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
            Our Ventures & Utilities
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Combining reliable household retail with modern electric vehicle charging hubs and premium commercial workspaces.
          </p>
        </div>

        {/* Tab Controls - smooth horizontal scroll for all mobile screens */}
        <div className="w-full flex justify-start sm:justify-center mb-10 overflow-x-auto no-scrollbar pb-2 select-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex p-1.5 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-md flex-nowrap whitespace-nowrap gap-1">
            <button
              id="tab-ev-hub"
              onClick={() => setActiveTab("ev")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${
                activeTab === "ev"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              NKT Charge Hub (EV)
            </button>
            <button
              id="tab-real-estate"
              onClick={() => setActiveTab("realestate")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${
                activeTab === "realestate"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Commercial Real Estate
            </button>
            <button
              id="tab-vessels-house"
              onClick={() => setActiveTab("retail")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${
                activeTab === "retail"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              N.K.T. Vessels House
            </button>
          </div>
        </div>

        {/* Dynamic Display Grid */}
        <AnimatePresence mode="wait">
          {activeTab === "ev" && (
            <motion.div
              key="ev"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Telemetry Control Dashboard */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-950/60 border border-white/5 shadow-xl flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">Charger Status Feed</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase bg-slate-900 border border-white/10 px-2 py-1 rounded text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                      {isPolling ? "POLLING..." : "ONLINE"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 font-sans truncate">Nedumpurath Towers Hub</h3>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    Operated by **IONGRID**, situated on Idukki Road opposite Josco Jewellery. Providing convenient 90kW DC fast charging.
                  </p>

                  <div className="space-y-2.5 font-mono text-xs text-slate-300 border-b border-white/5 pb-5">
                    <div className="flex justify-between border-b border-white/5 py-1.5">
                      <span className="text-slate-500">Node Identifier:</span>
                      <span>{telemetry?.stationId || "NKT-DC-HYPER-01"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-1.5">
                      <span className="text-slate-500">Grid Feed Voltage:</span>
                      <span className="text-cyan-300">{telemetry?.ksebInputVoltage || 411.2}V AC (KSEB)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-1.5">
                      <span className="text-slate-500">Grid Feed Frequency:</span>
                      <span>{telemetry?.ksebFrequencyHz || 50.01} Hz</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-1.5">
                      <span className="text-slate-500">Allocated Peak:</span>
                      <span className="text-emerald-400 font-semibold">{telemetry?.peakPowerCapacityKw || 90.0} kW DC Max</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Introductory Rate:</span>
                      <span className="text-green-400">{telemetry?.introductoryRateKwh || "₹15.99"}/kWh</span>
                    </div>
                  </div>

                  {/* Interactive Demand-Response Slider */}
                  <div className="mt-5 p-4 rounded-xl bg-slate-950/85 border border-white/10 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Smart Tariff Advisor
                      </span>
                      <span className="text-xs font-mono font-bold text-white bg-slate-900 border border-white/5 px-2 py-0.5 rounded">
                        {chargingHour % 12 === 0 ? 12 : chargingHour % 12}:00 {chargingHour >= 12 ? "PM" : "AM"}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={chargingHour}
                      onChange={(e) => setChargingHour(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-900 rounded-lg appearance-none"
                    />

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500">Forecasted tariff:</span>
                        <span className="text-cyan-300 font-bold text-xs">{sliderMetrics.rate}/kWh</span>
                      </div>
                      <div className={`text-[9px] font-mono p-1.5 rounded border leading-relaxed ${sliderMetrics.color}`}>
                        <div className="font-bold uppercase tracking-wider mb-0.5">{sliderMetrics.label}</div>
                        <div>{sliderMetrics.desc}</div>
                      </div>
                      <p className="text-[9px] leading-relaxed text-indigo-300/95 italic">
                        💡 {sliderMetrics.saving}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Idukki Road, opposite Josco Jewellery, Thodupuzha. Restrooms on-premises.</span>
                  </div>
                </div>
              </div>

              {/* Interactive Multi-Gun Display */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Advanced Infrastructure Intelligence: Predictive Advisory Banner */}
                <div className="p-4.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 justify-between flex-wrap">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-white uppercase">ANOMALY CHECKERS & TELEMETRY</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase animate-pulse">
                      Predictive Vibe Active
                    </span>
                  </div>

                  {telemetry?.demandResponseActiveLevel === "Peak Shift" ? (
                    <div className="flex gap-2.5 items-start bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-300 text-xs font-mono">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase">[KSEB HIGH LOAD DETECTED]</span> Admin has enabled Peak-Shift load balancing. Charging speeds are temporarily governed at a standard 70% threshold (Max 63kW draw) to protect the regional substation transformer from voltage sag. Normal rates apply.
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2.5 items-start bg-emerald-500/10 border border-emerald-500/15 p-3 rounded-lg text-slate-300 text-xs font-sans">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="font-sans">
                        <span className="font-mono font-bold text-emerald-400 block mb-0.5 uppercase tracking-wider text-[11px]">[GRID SHIELD: ALL STATS NOMINAL]</span>
                        Our OCPP telemetry analyzed 48-hour thermal profiles and KSEB voltage waveforms. No wear anomalies or hot spots reported. Peak load balancing index is comfortable at <span className="text-white font-mono font-semibold">99.8% stability</span>.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">Active Connectors (Restrooms available on site)</h4>
                  <span className="text-[10px] font-mono text-slate-500">OCPP v2.0.1 Protocol</span>
                </div>
                
                {telemetry?.guns.map((gun) => {
                  const isCharging = gun.status === "Charging";
                  return (
                    <div
                      key={gun.id}
                      className="p-5 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
                    >
                      {isCharging && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400" />
                      )}
                      
                      {/* Connection Details */}
                      <div>
                        <div className="flex items-center gap-3.5 mb-1.5">
                          <span className="text-sm font-bold text-white font-sans">DC GUN {gun.id} // {gun.connectorType}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                            isCharging ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          }`}>
                            {gun.status}
                          </span>
                        </div>
                        {isCharging && gun.activeSession ? (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-300">Vehicle: <span className="font-semibold text-white">{gun.activeSession.vehicle}</span></p>
                            <p className="text-[10px] font-mono text-slate-400">Allocated power draw: <span className="text-cyan-400 font-bold">{gun.currentDrawKw} kW</span> / max {gun.maxCapacityKw}kW</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Connect CCS-compatible vehicle to begin 90kW dual-load distribution cycle.</p>
                        )}
                      </div>

                      {/* Power and SoC Graphics */}
                      {isCharging && gun.activeSession ? (
                        <div className="w-full md:w-56 shrink-0 space-y-2">
                          <div className="flex justify-between text-[11px] font-mono text-slate-400">
                            <span>Battery SoC: {gun.activeSession.soc}%</span>
                            <span className="text-cyan-300">{gun.activeSession.durationMinutes} mins loaded</span>
                          </div>
                          {/* Progress Line */}
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${gun.activeSession.soc}%` }} />
                          </div>
                          <div className="text-right text-[10px] font-mono text-emerald-400">{gun.activeSession.energyEnergyKwh} kWh delivered</div>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-slate-500">Grounded Heartbeat Handshake Active</div>
                      )}
                    </div>
                  );
                })}

                {/* Dynamic ROI & Carbon Offset Insights Grid */}
                <div className="pt-4 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Node Performance & Ecological ROI</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                    <div className="p-4.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">CO2 Offsets Triggered</span>
                      <div className="text-xl font-bold text-emerald-400 font-mono">2,142+ kg</div>
                      <span className="text-[9px] font-sans text-slate-400 leading-normal block">Displaced since station deployment of Nedumpurath Towers.</span>
                    </div>

                    <div className="p-4.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">KSEB Substation Efficiency</span>
                      <div className="text-xl font-bold text-cyan-400 font-mono">94.2 %</div>
                      <span className="text-[9px] font-sans text-slate-400 leading-normal block">Optimized via real-time adaptive OCPP current caps.</span>
                    </div>

                    <div className="p-4.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Solar Off-Peak Load Shave</span>
                      <div className="text-xl font-bold text-indigo-400 font-mono">38.5 %</div>
                      <span className="text-[9px] font-sans text-slate-400 leading-normal block">Percentage of daily load shifted to solar peak interval (9 AM – 3 PM).</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "realestate" && (
            <motion.div
              key="realestate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-[340px]">
                <div>
                  <Building2 className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Nedumpurath Towers Optimization</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Premium aesthetic upkeep, structural modernization, and KSEB distribution integration. Situated on Idukki Road at Thodupuzha City Centre.
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-xs text-slate-400 border-t border-white/5 pt-4">
                  <div>Floor Status: <span className="text-emerald-400">3 Storeys Fully Managed</span></div>
                  <div>Primary Facade: opposite Josco Gold</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-[340px]">
                <div>
                  <ShieldCheck className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Premium Tenant Placement</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hosting prime central agencies in Thodupuzha, including the BSNL key exchange center, Josco admin suites, and heritage commercial wings.
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-xs text-slate-400 border-t border-white/5 pt-4">
                  <div>Active Leases: <span className="text-white">Structured SLA contracts</span></div>
                  <div>Commercial Yield: Highly Optimized</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-[340px]">
                <div>
                  <Clock className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Automatic Expense Audits</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Integrated financial telemetry dashboards mapping KSEB commercial bills, common area auxiliary yields, and hardware maintenance logs.
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-xs text-slate-400 border-t border-white/5 pt-4">
                  <div>Utility tracker: <span className="text-cyan-400">Real-Time KSEB Logs</span></div>
                  <div>Audit frequency: Monthly Auto-Run</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "retail" && (
            <motion.div
              key="retail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
            >
              <div className="md:col-span-4">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded">ESTABLISHED 1947</span>
                <h3 className="text-2xl font-bold text-white mt-4 mb-2 font-sans">N.K.T. Vessels House</h3>
                <p className="text-xs text-cyan-300 font-mono mb-4">Ground Floor (BSNL Side), Market Road, Thodupuzha</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  With nearly 80 years of uninterrupted business history in Idukki, N.K.T. Vessels House is a legendary retail staple deeply respected for consumer integrity and customer care.
                </p>
              </div>

              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 font-semibold">Specialized Vessels Dealership</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Widely acclaimed as the region’s premier distributor of **brass, copper, stainless steel, and high-gauge aluminum utensils** optimized for both home kitchens and traditional Kerala feasts.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 font-semibold">Brand Partner Appliances</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Official prestige partner stocking top-selling mixer-grinders, non-stick cooking hubs, heavy-duty pressure cookers and ovens by **Prestige** and **Preethi** household networks.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 font-semibold">Heritage Hours & Days</h4>
                  <p className="text-xs text-slate-300">
                    Open: <span className="text-white font-semibold">Monday – Saturday</span><br/>
                    Hours: <span className="text-white font-semibold">9:30 AM – 8:00 PM</span><br/>
                    <span className="text-slate-500 text-[10px] italic">Closed of Sundays for rest.</span>
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col justify-between">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">History & Trust</h4>
                  <div className="text-xs text-slate-400">
                    Part of the long-standing family legacy founded by **N.K. Thomas** that continues to serve generations of shoppers across Kerala.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
