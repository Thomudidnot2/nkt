import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Calendar, 
  Paperclip, 
  Sparkles, 
  Inbox 
} from "lucide-react";

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface ThreadMessage {
  id: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
}

interface WorkspaceGmailProps {
  token: string;
  telemetrySnapshot?: string;
}

export default function WorkspaceGmail({ token, telemetrySnapshot }: WorkspaceGmailProps) {
  const [threads, setThreads] = useState<ThreadMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadMessage | null>(null);
  
  // Loaders
  const [isInboxLoading, setIsInboxLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotif, setSuccessNotif] = useState("");

  // Composer fields
  const [toEmail, setToEmail] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [bodyText, setBodyText] = useState("");

  // 1. Fetch Inbox Email threads
  const fetchRecentEmails = async () => {
    setIsInboxLoading(true);
    setErrorMsg("");
    try {
      const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=label:INBOX", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!listRes.ok) throw new Error("Could not index mailbox files.");
      const listData = await listRes.json();
      const messages = listData.messages || [];

      // Fetch headers for each message details
      const detailPromises = messages.map(async (msg: any) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!detailRes.ok) return null;
        const detailData = await detailRes.json();
        
        const headers: GmailMessageHeader[] = detailData.payload?.headers || [];
        const fromHeader = headers.find(h => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
        const subjectHeader = headers.find(h => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const dateHeader = headers.find(h => h.name.toLowerCase() === "date")?.value || "";

        return {
          id: msg.id,
          snippet: detailData.snippet || "",
          from: fromHeader,
          subject: subjectHeader,
          date: dateHeader
        };
      });

      const reports = await Promise.all(detailPromises);
      setThreads(reports.filter(r => r !== null) as ThreadMessage[]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load Gmail messages.");
    } finally {
      setIsInboxLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecentEmails();
    }
  }, [token]);

  // Pre-seed telemetry summary into composer
  const insertTelemetryData = () => {
    if (telemetrySnapshot) {
      setSubjectLine("⚡ NKT Charge Hub Live Operational Briefing Sheet");
      setBodyText(
        `Dear Team,\n\nI have generated the live OCPP engineering snap metrics summary directly from Nedumpurath Towers. Details are attached below:\n\n` +
        `====================================================\n` +
        `   NKT CHARGE HUB AUTOMATED OCPP COMPLIANCE REPORT\n` +
        `====================================================\n` +
        `${telemetrySnapshot.replace(/\*/g, "")}\n\n` +
        `Best regards,\n` +
        `NKT Digital Operations Unit.`
      );
      setSuccessNotif("Pre-loaded station diagnostics snapshot!");
      setTimeout(() => setSuccessNotif(""), 3000);
    }
  };

  // 2. Draft and Send MIME Email via Google API (with MANDATORY user confirmation)
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subjectLine.trim() || !bodyText.trim() || isSending) return;

    // Explicit Confirmation dialog as mandated by Workspace security guidelines
    const confirmed = window.confirm(
      `Confirm Email Transmission:\n\nTo: ${toEmail}\nSubject: ${subjectLine}\n\nAre you absolutely sure you want to send this email via Gmail?`
    );
    if (!confirmed) return;

    setIsSending(true);
    try {
      // Build MIME RFC-822 message structure
      const emailParts = [
        `To: ${toEmail.trim()}`,
        "Content-Type: text/plain; charset=\"UTF-8\"",
        "MIME-Version: 1.0",
        `Subject: ${subjectLine.trim()}`,
        "",
        bodyText
      ];
      const mimeString = emailParts.join("\r\n");

      // Safe Base64URL Encoder
      const base64UrlSafe = btoa(unescape(encodeURIComponent(mimeString)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: base64UrlSafe })
      });

      if (!res.ok) {
        throw new Error(`Gmail API failure: ${res.statusText}`);
      }

      // Reset Form State on success
      setToEmail("");
      setSubjectLine("");
      setBodyText("");
      setSuccessNotif("Gmail successfully dispatched to recipient!");
      setTimeout(() => setSuccessNotif(""), 4500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Email failed to transmit.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* State banners */}
      {errorMsg && (
        <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successNotif && (
        <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs items-center">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotif}</span>
        </div>
      )}

      {/* Main Mail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inbox Queue Pane */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between h-[520px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Gmail operator Inbox</h3>
              </div>
              <button
                id="gmail-refresh-btn"
                onClick={fetchRecentEmails}
                disabled={isInboxLoading}
                className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer border border-white/10"
              >
                {isInboxLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Feed
              </button>
            </div>

            {/* Scrollable messages List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1 no-scrollbar">
              {isInboxLoading && threads.length === 0 ? (
                <div className="py-24 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                  <span>Loading recent inboxes and incoming threads...</span>
                </div>
              ) : threads.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl bg-slate-950/20 flex flex-col items-center gap-2">
                  <Mail className="w-8 h-8 text-slate-700" />
                  No messages found inside INBOX classification labels.
                </div>
              ) : (
                threads.map((item) => (
                  <div
                    key={item.id}
                    id={`gmail-msg-${item.id}`}
                    onClick={() => setSelectedThread(selectedThread?.id === item.id ? null : item)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      selectedThread?.id === item.id 
                        ? "bg-cyan-500/5 border-cyan-500/30" 
                        : "bg-slate-950/70 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 text-[10px] font-mono">
                      <span className="font-bold text-cyan-300 truncate max-w-[140px]" title={item.from}>
                        {item.from.split("<")[0] || item.from}
                      </span>
                      <span className="text-slate-550 text-slate-500 shrink-0">
                        {item.date ? new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-normal truncate">{item.subject}</h4>
                    
                    <p className={`text-[10px] text-slate-400 leading-relaxed font-sans ${
                      selectedThread?.id === item.id ? "" : "line-clamp-2"
                    }`}>
                      {item.snippet}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Composer Pane */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 flex flex-col gap-4 justify-between h-[520px]">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Mail Composer
              </span>

              {telemetrySnapshot && (
                <button
                  type="button"
                  id="gmail-preseed-btn"
                  onClick={insertTelemetryData}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-[10px] font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> PRE-SEED DIAGS
                </button>
              )}
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Recipient (Email Address)</label>
                <input
                  type="email"
                  placeholder="to: partner@iongrid.co"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Subject Title</label>
                <input
                  type="text"
                  placeholder="e.g. Demand Rate Analysis Snapshot"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Message Body</label>
                <textarea
                  placeholder="Type mail content or import telemetry diags above..."
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 resize-none font-sans leading-relaxed"
                  required
                />
              </div>

              <button
                id="gmail-send-submit"
                type="submit"
                disabled={isSending || !toEmail}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )} Dispatch via Google Mail API
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
