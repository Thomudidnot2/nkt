import { useState, useEffect, useRef, FormEvent } from "react";
import { motion } from "motion/react";
import {
  Lock,
  Terminal,
  Activity,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Power,
  Trash2,
  Zap,
  Building2,
  Archive,
  Cpu,
  Cloud
} from "lucide-react";
import { EvTelemetry, Property, Lead, AgenticLog } from "../types";
import WorkspaceHub from "./WorkspaceHub";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "ev-manager" | "property-crm" | "leads-inbox" | "logs" | "workspace-orchestrator">("overview");

  // Admin Data states
  const [telemetry, setTelemetry] = useState<EvTelemetry | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<AgenticLog[]>([]);

  const [simulatedWebhookEvent, setSimulatedWebhookEvent] = useState("LEAD_RECON");
  const [simulatedPayload, setSimulatedPayload] = useState('{"trigger": "zapier", "agent": "Gemini-3.5-Flash"}');
  const [webhookSuccessMsg, setWebhookSuccessMsg] = useState("");

  // Action states for Advanced Infrastructure Intelligence
  const [predictiveTickets, setPredictiveTickets] = useState<any[]>([]);
  const [newLogTexts, setNewLogTexts] = useState<{ [key: string]: string }>({});
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Auto-select first asset
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Poll intervals
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    const fetchData = async () => {
      try {
        const [telemetryRes, propertiesRes, leadsRes, logsRes, ticketsRes] = await Promise.all([
          fetch("/api/telemetry/ev"),
          fetch("/api/properties"),
          fetch("/api/leads"),
          fetch("/api/telemetry/logs"),
          fetch("/api/telemetry/ev/tickets")
        ]);

        if (active) {
          if (telemetryRes.ok) setTelemetry(await telemetryRes.json());
          if (propertiesRes.ok) setProperties(await propertiesRes.json());
          if (leadsRes.ok) setLeads(await leadsRes.json());
          if (logsRes.ok) setLogs(await logsRes.json());
          if (ticketsRes.ok) setPredictiveTickets(await ticketsRes.json());
        }
      } catch (err) {
        console.error("Dashboard syncing error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000); // sync admin views rapidly!

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Resolve an active predictive ticket
  const resolvePredictiveTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/telemetry/ev/tickets/${id}/resolve`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setPredictiveTickets(data.tickets);
      }
    } catch (err) {
      console.error("Failed to resolve predictive ticket:", err);
    }
  };

  // Switch demand response configuration
  const handleDemandResponseToggle = async (level: string) => {
    try {
      const res = await fetch("/api/telemetry/ev/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level })
      });
      if (res.ok) {
        const data = await res.json();
        if (telemetry) {
          setTelemetry({ ...telemetry, demandResponseActiveLevel: data.demandResponseLevel });
        }
      }
    } catch (err) {
      console.error("Failed to update demand response level:", err);
    }
  };

  // Submit and add completed lease maintenance log
  const handleAddPropertyLog = async (id: string) => {
    const issue = newLogTexts[id];
    if (!issue || !issue.trim()) return;

    try {
      const res = await fetch(`/api/properties/${id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local property representation
        setProperties((prev) => prev.map((p) => p.id === id ? data.property : p));
        setNewLogTexts((prev) => ({ ...prev, [id]: "" }));
      }
    } catch (err) {
      console.error("Failed to append property maintenance log:", err);
    }
  };

  // Handle Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || "Login validation failed.");
      }
    } catch (err) {
      setLoginError("Failed to authenticate. Server offline.");
    }
  };

  const executeDemoLogin = () => {
    setIsAuthenticated(true);
  };

  // Modify leads status
  const updateLeadStatus = async (id: string, status: "New" | "Reviewed" | "Archived") => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      }
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  // Simulate an agent webhook
  const triggerSimulatedWebhook = async () => {
    setWebhookSuccessMsg("");
    try {
      const res = await fetch("/api/webhooks/agentic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: simulatedWebhookEvent,
          source: "Devin-Vibe-Automated-Daemon",
          payload: JSON.parse(simulatedPayload)
        })
      });
      if (res.ok) {
        setWebhookSuccessMsg("Webhook accepted successfully! Processed via memory logs.");
        setTimeout(() => setWebhookSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert("Invalid JSON payload or webhook exception");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-indigo-500" />
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white font-sans">Administrative Portal</h2>
            <p className="text-xs text-slate-400 mt-1.5">Authorized credentials are required to view statistics</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-sans text-sm">
            <div>
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1">Administrative Email</label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nktchargehub@iongridenergy.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 font-sans focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1">Passcode Credentials</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 font-sans focus:outline-none focus:border-cyan-500"
              />
            </div>

            {loginError && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/15"
            >
              Authorize Access
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="border-t border-white/10 pt-5 mt-5 text-center">
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-2.5">Demo One-Click Access</p>
            <div className="space-y-1">
              <button
                id="admin-demo-bypass-btn"
                onClick={executeDemoLogin}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-lg bg-slate-900 border border-cyan-500/20 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer text-xs font-semibold"
              >
                <Cpu className="w-3.5 h-3.5" />
                Access Demo Dashboard
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5 font-mono">Preset: user 'nktchargehub@iongridenergy.com' / passcode 'nkt@IGRD!16'</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-[85vh] rounded-2xl bg-slate-950/60 border border-white/5 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 flex-1">
      {/* Left Sidebar control rail */}
      <div className="lg:col-span-3 bg-slate-900/80 border-b lg:border-r lg:border-b-0 border-white/5 p-4 sm:p-6 space-y-4 lg:space-y-6 flex flex-col lg:justify-between">
        <div>
          {/* Logo Brand in sidebar */}
          <div className="flex items-center gap-3 mb-4 lg:mb-8">
            <div className="p-2 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded-lg">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-white text-sm">NKT Portal</h3>
              <p className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">Manager Dashboard</p>
            </div>
          </div>

          {/* Nav Rails */}
          <div className="flex lg:flex-col overflow-x-auto no-scrollbar whitespace-nowrap lg:whitespace-normal gap-2 lg:gap-1.5 font-sans -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 lg:pb-0 select-none">
            <button
              id="admin-nav-overview"
              onClick={() => setActiveTab("overview")}
              className={`flex-1 lg:w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 gap-3 ${
                activeTab === "overview" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                KPI Overview
              </span>
            </button>

            <button
              id="admin-nav-ev"
              onClick={() => setActiveTab("ev-manager")}
              className={`flex-1 lg:w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 gap-3 ${
                activeTab === "ev-manager" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Zap className="w-4 h-4" />
                EV Charger Monitor
              </span>
              {telemetry && telemetry.activeSessionsCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeTab === "ev-manager" ? "bg-slate-950/10 text-slate-900" : "bg-cyan-500/10 text-cyan-400"}`}>
                  {telemetry.activeSessionsCount} LOAD
                </span>
              )}
            </button>

            <button
              id="admin-nav-properties"
              onClick={() => setActiveTab("property-crm")}
              className={`flex-1 lg:w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 gap-3 ${
                activeTab === "property-crm" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                Asset Portfolio
              </span>
            </button>

            <button
              id="admin-nav-leads"
              onClick={() => setActiveTab("leads-inbox")}
              className={`flex-1 lg:w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 gap-3 ${
                activeTab === "leads-inbox" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                Leads Inbox
              </span>
              {leads.filter((l) => l.status === "New").length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeTab === "leads-inbox" ? "bg-slate-950/10 text-slate-900" : "bg-red-500/20 text-red-400"}`}>
                  {leads.filter((l) => l.status === "New").length}
                </span>
              )}
            </button>

            <button
              id="admin-nav-logs"
              onClick={() => setActiveTab("logs")}
              className={`flex-1 lg:w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 gap-3 ${
                activeTab === "logs" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4" />
                System Update Logs
              </span>
            </button>

            <button
              id="admin-nav-workspace"
              onClick={() => setActiveTab("workspace-orchestrator")}
              className={`flex-1 lg:w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 gap-3 ${
                activeTab === "workspace-orchestrator" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4" />
                Workspace Hub
              </span>
            </button>
          </div>
        </div>

        {/* Access level indicator */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>OPERATOR:</span>
            <span className="text-white">George S. Thomas</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Grid Authority:</span>
            <span className="text-cyan-400">ADMINISTRATOR</span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full text-center py-1 rounded bg-red-950/30 hover:bg-red-900/40 border border-red-500/10 text-red-400 text-[10px] font-mono transition-colors tracking-wide mt-3 cursor-pointer"
          >
            DISCONNECT CONSOLE
          </button>
        </div>
      </div>

      {/* Main content grid area */}
      <div className="lg:col-span-9 p-6 overflow-y-auto space-y-6">
        
        {/* TAB 1: Global Operations Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white font-sans">Global Operations Overview</h3>
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Total EV Yield</span>
                  <div className="text-2xl font-bold font-mono text-white">412.5 kWh</div>
                  <span className="text-[9px] font-mono text-slate-400">Total delivered today</span>
                </div>
                <div className="p-3.5 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Real Estate Occupancy</span>
                  <div className="text-2xl font-bold font-mono text-cyan-300">83.3 %</div>
                  <span className="text-[9px] font-mono text-slate-400">5 of 6 spaces leased</span>
                </div>
                <div className="p-3.5 rounded-lg bg-indigo-950/40 text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Awaiting Leads</span>
                  <div className="text-2xl font-bold font-mono text-red-400">
                    {leads.filter((l) => l.status === "New").length} NEW
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">Immediate reply required</span>
                </div>
                <div className="p-3.5 rounded-lg bg-red-950/40 text-red-400 border border-red-500/20">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick telemetry graph simulator */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-sans font-bold text-white">Interactive Power Allocation (IONGRID Node)</h4>
                  <p className="text-[10px] text-slate-500 font-sans">Simulating raw drawing curves of dual gun CCS setup at Nedumpurath Towers</p>
                </div>
                <div className="text-xs font-mono text-cyan-400">{telemetry?.totalPowerDrawKw || "80.4"} kW draw</div>
              </div>
              <div className="h-28 flex items-end gap-1 px-4 py-2 bg-slate-950 rounded-xl relative overflow-hidden border border-white/5">
                {/* Simulated vertical canvas graphs pillars */}
                {Array.from({ length: 42 }).map((_, i) => {
                  const val = Math.max(10, Math.floor(40 + Math.sin(i / 3) * 25 + Math.cos(i / 1.5) * 12));
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-cyan-950 to-cyan-400 rounded-t-sm transition-all"
                      style={{ height: `${val}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Charge Hub Live Monitor */}
        {activeTab === "ev-manager" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-sans">IONGRID Station Dispatch (Hyper-DC)</h3>
                <p className="text-[10px] md:text-xs text-slate-400">Ground floor, opposite Josco Jewellery, Market road corridor</p>
              </div>
              <div className="inline-flex gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-slate-900 border border-cyan-500/20 px-3 py-1.5 rounded text-cyan-400">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  KSEB Load: {telemetry?.ksebInputVoltage || 411.2}V AC
                </span>
              </div>
            </div>

            {/* CONTROL CENTRE: Predictive Maintenance & Demand Response Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Box A: OCLC Demand Response Profiler */}
              <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white">Grid Demand-Response Profile</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Toggle dynamic pricing and capacity barriers to conform to regional Kerala State Electricity Board (KSEB) loading curves during peak stress hours.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { id: "Low", desc: "Allows full 99kW boost draws, standard ₹13.99/kWh rate." },
                    { id: "Balanced", desc: "Optimizes peak baseline at 90kW, rate is ₹15.99/kWh." },
                    { id: "Peak Shift", desc: "Throttles CCS grids by 30% (63kW peak) during high stress, ₹19.49/kWh." }
                  ].map((level) => {
                    const isActive = telemetry?.demandResponseActiveLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => handleDemandResponseToggle(level.id)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between h-28 ${
                          isActive
                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-300"
                            : "bg-slate-950 border-white/5 hover:border-white/10 text-slate-400"
                        }`}
                      >
                        <span className="text-[11px] font-bold font-mono uppercase">{level.id}</span>
                        <span className="text-[9px] leading-normal opacity-80">{level.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box B: Grid Predictive Warning Terminal */}
              <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white">Predictive Maintenance Alerts</h4>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-rose-500/10 text-rose-300 uppercase">
                    AI Diagnostic Feed
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[170px] overflow-y-auto">
                  {predictiveTickets.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic p-3 text-center">No active anomalies reported by OCPP heartbeat analyzer.</div>
                  ) : (
                    predictiveTickets.map((ticket) => {
                      const isResolved = ticket.status === "Resolved";
                      return (
                        <div key={ticket.id} className="p-3 bg-slate-950 rounded-lg border border-white/5 flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? "bg-slate-700" : ticket.severity === "Medium" ? "bg-amber-400" : "bg-cyan-400"}`} />
                              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{ticket.unit}</span>
                              <span className={`text-[8px] font-mono px-1 py-0.1 rounded ${ticket.severity === "Medium" ? "bg-amber-500/10 text-amber-300" : "bg-cyan-500/10 text-cyan-300"}`}>
                                {ticket.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-white font-semibold">{ticket.issue}</p>
                            <p className="text-[9px] text-slate-400 leading-normal font-sans">💡 {ticket.advisory}</p>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {isResolved ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                                <CheckCircle2 className="w-3 h-3 text-slate-500" /> Resolved
                              </span>
                            ) : (
                              <button
                                onClick={() => resolvePredictiveTicket(ticket.id)}
                                className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900 border border-rose-500/20 text-rose-300 text-[9px] font-mono uppercase tracking-wider cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Connectors Layout */}
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">Live Connector Diagnostics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {telemetry?.guns.map((gun) => {
                const isCh = gun.status === "Charging";
                return (
                  <div key={gun.id} className="p-6 rounded-xl bg-slate-900/60 border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500">CONNECTOR PORT {gun.id}</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{gun.connectorType}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isCh ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>{gun.status}</span>
                    </div>

                    <div className="space-y-2 border-t border-b border-white/5 py-4 font-mono text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Max Charging rate:</span>
                        <span>{gun.maxCapacityKw} kW</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Active draw:</span>
                        <span className="text-cyan-400">{gun.currentDrawKw} kW</span>
                      </div>
                      {isCh && gun.activeSession ? (
                        <>
                          <div className="flex justify-between text-slate-400">
                            <span>Vehicle Linked:</span>
                            <span className="text-white">{gun.activeSession.vehicle}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Delivered Kwh:</span>
                            <span className="text-emerald-400">{gun.activeSession.energyEnergyKwh} kWh</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Client SoC:</span>
                            <span>{gun.activeSession.soc}%</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-600 text-[11px] italic">No electric load active. Idle state reporting handshake heartbeat.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Asset CRM (Real estate properties and maintenance logs) */}
        {activeTab === "property-crm" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white font-sans">Nedumpurath Towers Lease CRM</h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Properties Directory */}
              <div className="lg:col-span-7 bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 bg-slate-950 font-mono text-xs uppercase tracking-wider text-slate-400 border-b border-white/5 flex justify-between items-center">
                  <span>Establishment Assets ({properties.length})</span>
                  <span className="text-[10px] text-cyan-400">Click to load Logbook</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto">
                  {properties.map((prop) => {
                    const isSelected = prop.id === selectedPropertyId;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => setSelectedPropertyId(prop.id)}
                        className={`p-4 flex justify-between items-center cursor-pointer transition-colors border-l-2 ${
                          isSelected ? "bg-cyan-500/5 border-cyan-400" : "border-transparent hover:bg-white/5"
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm">{prop.name}</h4>
                          <span className="text-[10px] text-slate-500 block font-mono">{prop.location}</span>
                          <p className="text-xs text-slate-400">Tenant: <span className="text-slate-300">{prop.tenant}</span></p>
                        </div>

                        <div className="space-y-1.5 text-right flex flex-col items-end">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${
                            prop.occupancyStatus === "Occupied" ? "bg-cyan-500/10 text-cyan-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {prop.occupancyStatus}
                          </span>
                          <div className="text-xs text-white font-mono font-semibold">{prop.monthlyRent}</div>
                          <div className="text-[10px] text-slate-400 bg-slate-950 border border-white/5 px-2 py-0.5 rounded block font-mono">
                            {prop.maintenanceLogs.length} Records
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Maintenance Logbook Panel */}
              <div className="lg:col-span-5 bg-slate-900/60 rounded-xl border border-white/5 p-5 flex flex-col justify-between h-[520px]">
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400">Selected Asset Logbook</span>
                    <h3 className="text-base font-bold text-white font-sans mt-1">
                      {properties.find((p) => p.id === selectedPropertyId)?.name || "Select an establishment..."}
                    </h3>
                    {properties.find((p) => p.id === selectedPropertyId) && (
                      <p className="text-xs text-slate-400 mt-1">
                        Active tenant: <span className="text-white font-semibold">{properties.find((p) => p.id === selectedPropertyId)?.tenant}</span> ({properties.find((p) => p.id === selectedPropertyId)?.occupancyStatus})
                      </p>
                    )}
                  </div>

                  {/* Logs Feed */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {!selectedPropertyId || (properties.find((p) => p.id === selectedPropertyId)?.maintenanceLogs.length || 0) === 0 ? (
                      <div className="text-xs font-mono text-slate-500 italic p-6 text-center">
                        No maintenance inspection logs on file for this workspace unit.
                      </div>
                    ) : (
                      properties.find((p) => p.id === selectedPropertyId)?.maintenanceLogs.map((log, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-white/5 space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                            <span>{new Date(log.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            <span className="text-cyan-300">✓ {log.loggedBy}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-normal">{log.issue}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submitting Maintenance Log Form */}
                {selectedPropertyId && (
                  <div className="space-y-3.5 border-t border-white/5 pt-4 mt-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                        Log Inspector/Maintenance Report
                      </label>
                      <textarea
                        value={newLogTexts[selectedPropertyId] || ""}
                        onChange={(e) => setNewLogTexts({ ...newLogTexts, [selectedPropertyId]: e.target.value })}
                        placeholder="e.g. Certified 3-phase power line, loaded sub-meters checked, aesthetic painting of corridors finalized."
                        rows={3}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                      />
                    </div>

                    <button
                      onClick={() => handleAddPropertyLog(selectedPropertyId)}
                      disabled={!(newLogTexts[selectedPropertyId] || "").trim()}
                      className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      ✓ Save to Ledger Database
                    </button>
                    <p className="text-[9px] text-center text-slate-500 font-mono">
                      Submits to IONGRID audit records.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Leads Inbox */}
        {activeTab === "leads-inbox" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white font-sans">Business Leads Inbox</h3>
            
            <div className="space-y-4">
              {leads.length === 0 ? (
                <div className="p-8 text-center bg-white/5 border border-white/5 rounded-xl text-slate-500">
                  No leads submitted. Public contact form will update here in real-time.
                </div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3 relative">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="font-bold text-white font-sans text-sm">{lead.name}</h4>
                        <span className="text-[10px] font-mono text-cyan-400">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          lead.status === "New" ? "bg-red-500/10 text-red-400 border border-red-500/20" : lead.status === "Reviewed" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-slate-800 text-slate-500"
                        }`}>{lead.status}</span>

                        <div className="flex gap-1">
                          {lead.status === "New" && (
                            <button
                              onClick={() => updateLeadStatus(lead.id, "Reviewed")}
                              className="p-1 px-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-semibold tracking-wide cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
                            </button>
                          )}
                          {lead.status !== "Archived" && (
                            <button
                              onClick={() => updateLeadStatus(lead.id, "Archived")}
                              className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold tracking-wide cursor-pointer flex items-center gap-1"
                            >
                              <Archive className="w-3.5 h-3.5" /> Archive
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-white/5">
                      {lead.message}
                    </p>
                    <div className="text-[9px] font-mono text-slate-500 text-right">
                      Received at: {new Date(lead.timestamp).toLocaleString("en-US")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Vibe Log Daemon */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-sans">Automated AI Webhook & Vibe Logs</h3>
                <p className="text-[10px] text-slate-500">Receiving automated outputs from Zapier/Make external trigger workflows.</p>
              </div>
              <button
                onClick={() => {
                  setLogs([]);
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded text-xs transition-colors px-2 cursor-pointer border border-white/10"
              >
                Clear Screen
              </button>
            </div>

            {/* Simulated webhook panel trigger */}
            <div className="p-5 rounded-xl bg-slate-900 border border-white/5 space-y-3 font-sans text-xs text-slate-300">
              <h4 className="font-bold text-white">Trigger Simulated Agent Webhook Payload</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Webhook Action Type</label>
                  <select
                    value={simulatedWebhookEvent}
                    onChange={(e) => setSimulatedWebhookEvent(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LEAD_RECON">LEAD_RECON (Reputation Verify)</option>
                    <option value="KSEB_BILL_AUDIT">KSEB_BILL_AUDIT (Audit Power Grid)</option>
                    <option value="THOMU_GRID_SYNC">THOMU_GRID_SYNC (Media upload map)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Payload JSON Parameter</label>
                  <input
                    type="text"
                    value={simulatedPayload}
                    onChange={(e) => setSimulatedPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center flex-wrap gap-2">
                <button
                  id="btn-simulate-webhook"
                  onClick={triggerSimulatedWebhook}
                  className="px-4.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer shadow shadow-cyan-500/10 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4 animate-spin [animation-duration:5s]" />
                  Simulate Trigger Command
                </button>
                {webhookSuccessMsg && <span className="text-emerald-400 text-xs font-mono">{webhookSuccessMsg}</span>}
              </div>
            </div>

            {/* Automated Logger Terminal */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950 shadow-2xl flex flex-col h-[320px]">
              <div className="px-4 py-2 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-slate-400">LOG DAEMON MONITOR v1.0.0</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-[11px] text-cyan-300 leading-snug">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">No output received. Fire the custom automated trigger payload above.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-2 items-start shrink-0">
                      <span className="text-slate-500">[{log.time}]</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 bg-white/5 text-slate-400 uppercase">{log.category}</span>
                      <span className="text-slate-200">{log.text}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Google Workspace Hub (Drive Repository & Chat Broadcast) */}
        {activeTab === "workspace-orchestrator" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-sans">NKT Workspace Orchestration Unit</h3>
              <p className="text-xs text-slate-500">Global Hub & Spoke configuration linking Google Cloud enterprise assets.</p>
            </div>
            <WorkspaceHub />
          </div>
        )}

      </div>
    </div>
  );
}
