import React, { useState, useEffect } from "react";
import { 
  Database, 
  ExternalLink, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Grid, 
  Plus, 
  Search, 
  RefreshCw 
} from "lucide-react";

interface WorkspaceSheetsProps {
  token: string;
}

export default function WorkspaceSheets({ token }: WorkspaceSheetsProps) {
  // Spreadsheet syncing states
  const [createdSheetId, setCreatedSheetId] = useState("");
  const [createdSheetUrl, setCreatedSheetUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"viewer" | "export">("viewer");
  
  // Viewer states
  const [inputSheetId, setInputSheetId] = useState("");
  const [inputRange, setInputRange] = useState("Sheet1!A1:G15");
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  
  // Statuses
  const [isSyncing, setIsSyncing] = useState(false);
  const [isViewerLoading, setIsViewerLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotif, setSuccessNotif] = useState("");

  // Helper validation dialogue helper
  const confirmAction = (text: string, onAgree: () => void) => {
    const doubleCheck = window.confirm(text);
    if (doubleCheck) {
      onAgree();
    }
  };

  // 1. Export Property Ledger dataset to a Google Sheet
  const handleExportPropertiesSheet = async () => {
    setErrorMsg("");
    setSuccessNotif("");

    // Read local properties records
    let localProps = [];
    try {
      const fetchRes = await fetch("/api/properties");
      if (fetchRes.ok) {
        localProps = await fetchRes.json();
      }
    } catch {
      // safe fallback
    }

    if (localProps.length === 0) {
      setErrorMsg("No active asset records available in Nedumpurath database to export.");
      return;
    }

    const message = `Sheet Exporter: Create a new spreadsheet named "NKT_Nedumpurath_CRM_Assets.xlsx" in your Google Sheets and populate all ${localProps.length} property items?`;
    
    // Explicit dialogue restriction check
    confirmAction(message, async () => {
      setIsSyncing(true);
      try {
        // Step A: POST Create new Spreadsheet document
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            properties: {
              title: "NKT Nedumpurath Towers CRM Assets Ledger"
            }
          })
        });

        if (!createRes.ok) throw new Error("Could not instantiate spreadsheet ledger file.");
        const spreadsheetObj = await createRes.json();
        const sheetId = spreadsheetObj.spreadsheetId;
        const sheetUrl = spreadsheetObj.spreadsheetUrl;

        // Step B: Formulate grid cells
        const headers = [
          "Asset ID", 
          "Property Name", 
          "Floor Location", 
          "Usage Type", 
          "Current Tenant", 
          "Area (Sq Ft)", 
          "Monthly Rent", 
          "Occupancy Code", 
          "Lease Expiration"
        ];
        
        const rows = localProps.map((p: any) => [
          p.id || "",
          p.name || "",
          p.location || "",
          p.type || "",
          p.tenant || "VACANT",
          String(p.areaSqFt ?? ""),
          p.monthlyRent || "",
          p.occupancyStatus || "Vacant",
          p.leaseExpiry || ""
        ]);

        const valuesPayload = [headers, ...rows];
        const writeRange = "Sheet1!A1:I" + (valuesPayload.length + 1);

        // Step C: Push content using values write endpoint
        const pushRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              range: writeRange,
              majorDimension: "ROWS",
              values: valuesPayload
            })
          }
        );

        if (!pushRes.ok) throw new Error("Cell payload deployment failed.");

        setCreatedSheetId(sheetId);
        setCreatedSheetUrl(sheetUrl);
        setInputSheetId(sheetId); // Load in viewer automatically
        setSuccessNotif(`Google Spreadsheet successfully written! Created id: ${sheetId}`);
        fetchRawSheetsData(sheetId, "Sheet1!A1:I10");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to finalize sheet sync.");
      } finally {
        setIsSyncing(false);
      }
    });
  };

  // 2. Export Lead Inquiries to a Google Sheet
  const handleExportLeadsSheet = async () => {
    setErrorMsg("");
    setSuccessNotif("");

    let localLeads = [];
    try {
      const fetchRes = await fetch("/api/leads");
      if (fetchRes.ok) {
        localLeads = await fetchRes.json();
      }
    } catch {
      // fallback
    }

    if (localLeads.length === 0) {
      setErrorMsg("No leads exist in the inbox to export.");
      return;
    }

    const message = `Sheet Exporter: Write all ${localLeads.length} client inquiry leads to a brand-new Google Sheet "NKT_Automated_Leads_Report"?`;
    
    confirmAction(message, async () => {
      setIsSyncing(true);
      try {
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            properties: {
              title: "NKT Client Leads & Feedback Ledger"
            }
          })
        });

        if (!createRes.ok) throw new Error("Spreadsheet reservation failed.");
        const resObj = await createRes.json();
        const sheetId = resObj.spreadsheetId;
        const sheetUrl = resObj.spreadsheetUrl;

        const headers = ["Lead ID", "Client Name", "Email Address", "Custom Message Code", "Inbox Status", "Submission Date"];
        const rows = localLeads.map((l: any) => [
          l.id || "",
          l.name || "",
          l.email || "",
          l.message || "",
          l.status || "New",
          l.timestamp || ""
        ]);

        const valuesPayload = [headers, ...rows];
        const writeRange = "Sheet1!A1:F" + (valuesPayload.length + 1);

        const pushRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              range: writeRange,
              majorDimension: "ROWS",
              values: valuesPayload
            })
          }
        );

        if (!pushRes.ok) throw new Error("Could not populate leads database cells.");

        setCreatedSheetId(sheetId);
        setCreatedSheetUrl(sheetUrl);
        setInputSheetId(sheetId);
        setSuccessNotif("Leads ledger exported successfully onto Google Sheets!");
        fetchRawSheetsData(sheetId, "Sheet1!A1:F10");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Leads transaction failed.");
      } finally {
        setIsSyncing(false);
      }
    });
  };

  // 3. Fetch cells from a custom raw Google Sheet
  const fetchRawSheetsData = async (sheetId: string, rangeRef: string) => {
    if (!sheetId.trim()) return;
    setIsViewerLoading(true);
    setErrorMsg("");
    try {
      const cleanRange = encodeURIComponent(rangeRef.trim());
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${cleanRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Could not access grid coordinates. Verify document shares or permissions.");
      }
      const data = await res.json();
      setSheetRows(data.values || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Query coordinates collapsed.");
    } finally {
      setIsViewerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab select rail */}
      <div className="flex border-b border-white/5 pb-2 ml-1/2 justify-start gap-4">
        <button
          id="sheets-tab-viewer"
          onClick={() => setActiveTab("viewer")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === "viewer" ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:text-white"
          }`}
        >
          📊 Spreadsheet Reader
        </button>
        <button
          id="sheets-tab-export"
          onClick={() => setActiveTab("export")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === "export" ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:text-white"
          }`}
        >
          📥 CRM Sheet Exporters
        </button>
      </div>

      {errorMsg && (
        <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successNotif && (
        <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs items-center animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotif}</span>
        </div>
      )}

      {activeTab === "viewer" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls side panel */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 space-y-4 h-fit">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4" /> Sheet Reader
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Google Spreadsheet ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1aBCDeFGhIjk..."
                  value={inputSheetId}
                  onChange={(e) => setInputSheetId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Sheet Range Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Sheet1!A1:G15"
                  value={inputRange}
                  onChange={(e) => setInputRange(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 font-mono font-semibold"
                />
              </div>

              <button
                id="sheets-read-btn"
                onClick={() => fetchRawSheetsData(inputSheetId, inputRange)}
                disabled={isViewerLoading || !inputSheetId.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isViewerLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )} Fetch Cell Coordinates
              </button>
            </div>
          </div>

          {/* Grid visual card */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Google Spreadsheet Cell Grid View
              </span>
              
              {createdSheetUrl && (
                <a
                  href={createdSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono shrink-0"
                >
                  OPEN LAST CREATED SHEET <ExternalLink className="w-3" />
                </a>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[350px] overflow-hidden">
              {isViewerLoading ? (
                <div className="py-24 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span>Loading cells from Google Sheets servers...</span>
                </div>
              ) : sheetRows.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl bg-slate-950/20 flex flex-col items-center gap-3">
                  <Grid className="w-8 h-8 text-slate-700 animate-pulse" />
                  Type a sheet ID and query range, or generate a fresh CRM database ledger tab on the next panel!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5 max-h-[380px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left font-sans text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-cyan-400 border-b border-white/10 font-bold tracking-wider text-[10px] uppercase font-mono">
                        {sheetRows[0]?.map((col, idx) => (
                          <th key={idx} className="p-2.5 border-r border-white/5 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sheetRows.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-900/50 text-slate-350 text-slate-300">
                          {row.map((cell, colIdx) => (
                            <td key={colIdx} className="p-2.5 border-r border-white/5 max-w-[150px] truncate" title={cell}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 relative overflow-hidden space-y-5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500" />
          
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400 animate-pulse" /> Corporate Ledger Spreadsheet Exporters
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Sync Nedumpurath Towers CRM records automatically into structured spreadsheet ledgers linked with your personal drive storage. These processes generate fully structured tables complete with headers for diagnostic or inspection purposes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Properties Exporter */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Leasing CRM Database</span>
                <h4 className="text-sm font-bold text-white">NKT Towers Asset Portfolio Exporter</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Write active properties, tenant lease expiration registries, sq footage, rent ledgers, maintenance categories, and active bookings straight to Sheets.
                </p>
              </div>

              <button
                id="sheets-export-properties"
                onClick={handleExportPropertiesSheet}
                disabled={isSyncing}
                className="py-2.5 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Initialize Asset Spreadsheet
              </button>
            </div>

            {/* Leads Exporter */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Inquiries Inbox Hub</span>
                <h4 className="text-sm font-bold text-white">Guest Client Leads & Inquiry Reports</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Export guest/operator contact records, inline query message boxes, classified system statuses ("New", "Reviewed"), and precise submission clocks.
                </p>
              </div>

              <button
                id="sheets-export-leads"
                onClick={handleExportLeadsSheet}
                disabled={isSyncing}
                className="py-2.5 px-3.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Deploy Client Leads Spreadsheet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
