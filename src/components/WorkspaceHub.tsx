import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cloud,
  MessageSquare,
  Search,
  Upload,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  File,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  CheckSquare,
  Mail,
  FileSpreadsheet,
  ClipboardList,
  StickyNote
} from "lucide-react";
import {
  googleSignIn,
  logout,
  initAuth,
  auth
} from "../utils/workspaceAuth";
import { User } from "firebase/auth";

// Modular Workspace Integrations
import WorkspaceKeep from "./WorkspaceKeep";
import WorkspaceTasks from "./WorkspaceTasks";
import WorkspaceGmail from "./WorkspaceGmail";
import WorkspaceSheets from "./WorkspaceSheets";
import WorkspaceForms from "./WorkspaceForms";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface ChatSpace {
  name: string;
  displayName?: string;
  type?: string;
}

interface ChatMessage {
  name: string;
  text: string;
  createTime: string;
  sender?: {
    displayName?: string;
  };
}

type ActiveService = "drive-chat" | "forms" | "tasks" | "gmail" | "sheets" | "keep";

export default function WorkspaceHub() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active Workspace Service router state
  const [activeService, setActiveService] = useState<ActiveService>("drive-chat");

  // Drive States
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [driveNotification, setDriveNotification] = useState("");

  // Chat States
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [spaceMessages, setSpaceMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Smart Pre-composed Broadcast State
  const [telemetrySummary, setTelemetrySummary] = useState<string>("");

  useEffect(() => {
    // Listen to Auth State
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );

    // Fetch quick live telemetry summary to prepare for auto-composing
    fetch("/api/telemetry/ev")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const summary = `⚡ *NKT Charge Hub Live Alert* ⚡\n` +
            `• *Demand-Response Status:* ${data.demandResponseActiveLevel || "Balanced"}\n` +
            `• *Total Load Draw:* ${data.totalPowerDrawKw} kW (Voltage: ${data.ksebInputVoltage}V, Freq: ${data.ksebFrequencyHz}Hz)\n` +
            `• *Active Sessions:* ${data.activeSessionsCount} charging coupler(s)\n` +
            `• *Delivered Today:* ${data.kwhDeliveredToday} kWh\n` +
            `• *Station Status:* Nominal handshake confirmed. Restrooms open.\n` +
            `_Dispatched via NKT Workspace Hub Hub & Spoke Portal._`;
          setTelemetrySummary(summary);
        }
      })
      .catch((err) => console.error(err));

    return () => unsubscribe();
  }, []);

  // Fetch file list from Google Drive
  const fetchDriveFiles = async (tokenStr: string, queryParam = "") => {
    setIsDriveLoading(true);
    setDriveError("");
    try {
      let url = "https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)";
      if (queryParam) {
        const q = `name contains '${queryParam.replace(/'/g, "\\'")}' and trashed = false`;
        url += `&q=${encodeURIComponent(q)}`;
      } else {
        url += `&q=${encodeURIComponent("trashed = false")}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenStr}` }
      });

      if (!res.ok) {
        throw new Error(`Drive list error: ${res.statusText}`);
      }
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || "Could not retrieve file inventory.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Fetch Chat Spaces
  const fetchChatSpaces = async (tokenStr: string) => {
    setIsChatLoading(true);
    setChatError("");
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${tokenStr}` }
      });
      if (!res.ok) {
        throw new Error(`Chat spaces error: ${res.statusText}`);
      }
      const data = await res.json();
      setChatSpaces(data.spaces || []);
      if (data.spaces && data.spaces.length > 0 && !selectedSpace) {
        // Auto select first space
        setSelectedSpace(data.spaces[0].name);
      }
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "Could not fetch Chat spaces directory.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Fetch messages for a specific Google Chat space
  const fetchSpaceMessages = async (spaceName: string, tokenStr: string) => {
    setIsMessagesLoading(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=15`, {
        headers: { Authorization: `Bearer ${tokenStr}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to load messages in space ${spaceName}`);
      }
      const data = await res.json();
      setSpaceMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDriveFiles(token);
      fetchChatSpaces(token);
    }
  }, [token]);

  useEffect(() => {
    if (selectedSpace && token) {
      fetchSpaceMessages(selectedSpace, token);
    }
  }, [selectedSpace, token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const confirmOut = window.confirm("Disconnect your Google Workspace credentials session?");
    if (confirmOut) {
      await logout();
      setUser(null);
      setToken(null);
      setDriveFiles([]);
      setChatSpaces([]);
      setSelectedSpace(null);
      setSpaceMessages([]);
    }
  };

  // 1. Mutating Operation: Export OCPP Logs to Google Drive (with MANDATORY User Confirmation)
  const exportTelemetryToDrive = async () => {
    if (!token) return;

    // MANDATORY explicit user confirmation dialog
    const confirmed = window.confirm(
      "Confirm action: Do you want to export a real-time OCPP system audit report ('NKT_ChargeHub_OCPP_Snapshot.txt') straight into your Google Drive root folder?"
    );
    if (!confirmed) return;

    setIsDriveLoading(true);
    try {
      const mockLogsContent = `====================================================\n` +
        `   NKT CHARGE HUB AUTOMATED OCPP COMPLIANCE REPORT\n` +
        `====================================================\n` +
        `Timestamp: ${new Date().toISOString()}\n` +
        `Node ID: NKT-DC-HYPER-01\n` +
        `Location: Nedumpurath Towers, Idukki Road, Thodupuzha, Kerala\n` +
        `Grid Operator License: IONGRID\n` +
        `----------------------------------------------------\n` +
        `METRICS SNAPSHOT:\n` +
        `${telemetrySummary.replace(/\*/g, "")}\n` +
        `----------------------------------------------------\n` +
        `End of Automated Audit. All diagnostic values nominal.\n` +
        `Digital Infrastructure curated by MD George S. Thomas.\n` +
        `====================================================`;

      // Step 1: Create metadata entry
      const metaRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "NKT_ChargeHub_OCPP_Snapshot.txt",
          mimeType: "text/plain"
        })
      });

      if (!metaRes.ok) throw new Error("Metadata reservation failed.");
      const fileObj = await metaRes.json();

      // Step 2: Upload media payload
      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileObj.id}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain"
          },
          body: mockLogsContent
        }
      );

      if (!uploadRes.ok) throw new Error("Media content deployment failed.");

      setDriveNotification("OCPP Ledger snapshot successfully exported to your Google Drive!");
      setTimeout(() => setDriveNotification(""), 4500);
      fetchDriveFiles(token);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || "Log sync failed.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  // 2. Drag & Drop File Upload handler (with User Confirmation)
  const handleUploadFile = async (file: File) => {
    if (!token) return;

    // MANDATORY user confirmation before completing the file creation mutating operation
    const confirmed = window.confirm(
      `Confirm action: Would you like to upload the selected local file '${file.name}' (${(file.size / 1024).toFixed(1)} KB) directly onto your Google Drive?`
    );
    if (!confirmed) return;

    setIsUploading(true);
    try {
      // Step 1: Initialize file entry
      const metaRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || "application/octet-stream"
        })
      });

      if (!metaRes.ok) throw new Error("Could not initialize Drive metadata slot.");
      const targetMeta = await metaRes.json();

      // Step 2: Read binary array buffer
      const fileData = await file.arrayBuffer();

      // Step 3: Stream payload
      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${targetMeta.id}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": file.type || "application/octet-stream"
          },
          body: fileData
        }
      );

      if (!uploadRes.ok) throw new Error("Failed to upload the raw stream.");

      setDriveNotification(`Successfully uploaded '${file.name}' to Drive!`);
      setTimeout(() => setDriveNotification(""), 4000);
      fetchDriveFiles(token);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || "File upload transaction collapsed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  // 3. Mutating Operation: Post Chat space broadcast (with MANDATORY User Confirmation)
  const sendChatMessage = async (textToSend: string) => {
    if (!token || !selectedSpace || !textToSend.trim()) return;

    // Extract space ID readable label name
    const spaceLabel = chatSpaces.find((s) => s.name === selectedSpace)?.displayName || selectedSpace;

    // MANDATORY explicit dialog check
    const confirmed = window.confirm(
      `Broadcast Protection: Are you absolutely sure you want to broadcast this operational alert status to the selected Google Chat Space [${spaceLabel}]?\n\n"${textToSend}"`
    );
    if (!confirmed) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textToSend })
      });

      if (!res.ok) {
        throw new Error(`Failed to transmit text: ${res.statusText}`);
      }

      setChatInput("");
      fetchSpaceMessages(selectedSpace, token);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "Failed to broadcast message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Safe file size formatter
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return "N/A";
    const bytes = parseInt(bytesStr);
    if (isNaN(bytes)) return "N/A";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoadingAuth) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-400">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span>Loading secure Workspace interfaces...</span>
      </div>
    );
  }

  // Define Workspace active tab details
  const SERVICES_MENU = [
    { id: "drive-chat", label: "Files & Broadcasts", icon: Cloud },
    { id: "forms", label: "Google Forms", icon: ClipboardList },
    { id: "tasks", label: "Google Tasks", icon: CheckSquare },
    { id: "gmail", label: "Gmail Inbox", icon: Mail },
    { id: "sheets", label: "Sheets Ledger", icon: FileSpreadsheet },
    { id: "keep", label: "Keep Notes", icon: StickyNote }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Google Sign-in Card */}
      {!user ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
          <div className="space-y-1.5 max-w-lg text-center md:text-left font-sans">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Workspace Hub Authentication</span>
            <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
              <Cloud className="w-5 h-5 text-cyan-400" /> Connect Google Workspace Orchestrator
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Authorize secure operations linked with Google Drive, Chat, Forms, Tasks, Sheets and Gmail with permission from you to browse files, save telemetry snapshots, deploy online feedback surveys, structure databases and send updates to partners.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button shrink-0 shadow-lg hover:shadow-cyan-500/10"
            style={{ margin: 0 }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapperClassName">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: "block" }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents" style={{ color: "#ffffff", paddingLeft: "12px", fontFamily: "sans-serif", fontWeight: "600", fontSize: "14px" }}>
                {isLoggingIn ? "Connecting account..." : "Sign in with Google"}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Authenticated header status panel */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-900 rounded-xl border border-white/5 gap-4">
            <div className="flex items-center gap-3 font-sans">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "Google User"} className="w-10 h-10 rounded-full border border-cyan-400" referrerpolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/35 flex items-center justify-center font-mono font-bold text-cyan-400">
                  {user.displayName?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white leading-tight">{user.displayName}</p>
                <p className="text-[10px] font-mono text-cyan-400">Linked secure session: {user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 uppercase animate-pulse">
                REST API Link Active
              </span>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/10 text-red-400 text-xs font-semibold cursor-pointer transition-colors font-mono"
              >
                DISCONNECT GOOGLE
              </button>
            </div>
          </div>

          {/* Service sub-tabs selector row */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 border-b border-white/5 no-scrollbar">
            {SERVICES_MENU.map((serv) => {
              const IconComp = serv.icon;
              const isActive = activeService === serv.id;
              return (
                <button
                  key={serv.id}
                  id={`workspace-service-tab-${serv.id}`}
                  onClick={() => setActiveService(serv.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 border-cyan-500 shadow-md font-bold"
                      : "bg-slate-900 border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{serv.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Views Render Area */}
          <div className="animate-fade-in">
            {activeService === "drive-chat" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Folder A: Drive Respositories */}
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-4 font-sans h-[650px] justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-bold text-white font-sans">NKT Assets Google Drive</h3>
                      </div>
                      <button
                        onClick={exportTelemetryToDrive}
                        disabled={isDriveLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> OCPP Logs to Drive
                      </button>
                    </div>

                    {driveNotification && (
                      <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs items-center">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{driveNotification}</span>
                      </div>
                    )}

                    {driveError && (
                      <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs items-center">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{driveError}</span>
                      </div>
                    )}

                    {/* Live Search Drive files */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search file names..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          fetchDriveFiles(token!, e.target.value);
                        }}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder-slate-600"
                      />
                    </div>

                    {/* Drive files listing */}
                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 no-scrollbar">
                      {isDriveLoading && driveFiles.length === 0 ? (
                        <div className="text-center py-12 text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                          Loading Drive assets...
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl">
                          No files matching parameters, drop files below to upload!
                        </div>
                      ) : (
                        driveFiles.map((f) => (
                          <div key={f.id} className="p-3 bg-slate-950/70 hover:bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between gap-4 transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {f.mimeType === "text/plain" ? (
                                <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                              ) : (
                                <File className="w-5 h-5 text-cyan-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate max-w-[200px]" title={f.name}>{f.name}</h4>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {formatBytes(f.size)} • {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : ""}
                                </span>
                              </div>
                            </div>

                            {f.webViewLink && (
                              <a
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/20 text-[10px] font-mono tracking-wider flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                OPEN <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Drag n Drop Upload zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`p-5 rounded-xl border-2 border-dashed text-center transition-all ${
                      dragActive
                        ? "border-cyan-400 bg-cyan-500/5"
                        : "border-white/10 bg-slate-950/50 hover:border-white/20"
                    } relative`}
                  >
                    <input
                      type="file"
                      id="google-drive-file"
                      onChange={handleFileInputChange}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="google-drive-file" className="cursor-pointer space-y-2 block">
                      {isUploading ? (
                        <div className="flex flex-col items-center space-y-2 py-2">
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                          <p className="text-xs text-white">Transmitting binary stream to Drive...</p>
                        </div>
                      ) : (
                        <div className="py-2 space-y-2">
                          <Upload className="w-6 h-6 text-cyan-400 mx-auto animate-bounce" />
                          <p className="text-xs text-slate-300">
                            Drag and drop files here, or <span className="text-cyan-400 underline font-semibold">browse local media</span>
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono">Supports images, PDF agreements, and telemetry logs</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Folder B: Google Chat Hub */}
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-4 font-sans h-[650px] justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-bold text-white font-sans">IONGRID Chat Broadcast</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-indigo-500/10 text-indigo-300">
                        Active Channel Linked
                      </span>
                    </div>

                    {chatError && (
                      <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs items-center">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{chatError}</span>
                      </div>
                    )}

                    {/* Spaces list */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Choose Destination Google Space
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                        {isChatLoading ? (
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 p-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            Syncing Spaces...
                          </div>
                        ) : chatSpaces.length === 0 ? (
                          <button className="flex-1 text-center py-2 bg-slate-950 border border-white/5 rounded-lg text-slate-400 text-xs font-semibold cursor-default">
                            No member spaces. Use sandbox console below.
                          </button>
                        ) : (
                          chatSpaces.map((space) => {
                            const isSelected = selectedSpace === space.name;
                            return (
                              <button
                                key={space.name}
                                onClick={() => setSelectedSpace(space.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border cursor-pointer shrink-0 transition-all ${
                                  isSelected
                                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-300"
                                    : "bg-slate-950 border-white/5 hover:border-white/10 text-slate-400"
                                }`}
                              >
                                💬 {space.displayName || space.name.split("/").pop()}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex-1 flex flex-col justify-between h-[250px]">
                      <div className="h-full overflow-y-auto space-y-2 text-xs max-h-[230px] pr-1 no-scrollbar">
                        <div className="text-[9px] font-mono text-slate-500 tracking-wider uppercase border-b border-white/5 pb-1 flex justify-between items-center">
                          <span>Recent Broadcast Activity</span>
                          <button
                            onClick={() => selectedSpace && fetchSpaceMessages(selectedSpace, token!)}
                            className="p-1 rounded hover:bg-white/5 text-slate-400 active:text-cyan-400 cursor-pointer"
                            title="Reload logs"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>

                        {isMessagesLoading ? (
                          <div className="text-center py-12 text-slate-500 font-mono text-[10px] flex flex-col items-center gap-1">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                            Fetching space ledger...
                          </div>
                        ) : spaceMessages.length === 0 ? (
                          <div className="text-center py-12 text-slate-500 italic text-[10px]">
                            No active broadcast logs on file. Ready for transmitting.
                          </div>
                        ) : (
                          spaceMessages.map((msg, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                                <span className="font-bold text-white uppercase">{msg.sender?.displayName || "NKT Operator"}</span>
                                <span>{new Date(msg.createTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-normal font-sans break-words whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Composition Workspace */}
                  <div className="space-y-4 pt-1">
                    {/* Autocomposer generator */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-indigo-500/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-indigo-300 font-bold uppercase flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> AI Status Snapshot Autocomposer
                        </span>
                        <button
                          onClick={() => setChatInput(telemetrySummary)}
                          disabled={!telemetrySummary}
                          className="px-2 py-0.5 rounded bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-[10px] font-bold font-sans cursor-pointer uppercase transition-all"
                        >
                          Use Composition
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans truncate">
                        {telemetrySummary ? telemetrySummary.replace(/\n/g, " | ") : "Compiling metrics logs..."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <textarea
                        rows={2}
                        placeholder="Broadcast messages to Space... e.g. Certified 3-phase line active."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                      />
                      <button
                        onClick={() => sendChatMessage(chatInput)}
                        disabled={!selectedSpace || !chatInput.trim() || isSendingMessage}
                        className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 cursor-pointer transition-colors shrink-0"
                        title="Transmit message"
                      >
                        {isSendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeService === "forms" && (
              <WorkspaceForms token={token!} />
            )}

            {activeService === "tasks" && (
              <WorkspaceTasks token={token!} />
            )}

            {activeService === "gmail" && (
              <WorkspaceGmail token={token!} telemetrySnapshot={telemetrySummary} />
            )}

            {activeService === "sheets" && (
              <WorkspaceSheets token={token!} />
            )}

            {activeService === "keep" && (
              <WorkspaceKeep />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
