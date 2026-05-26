import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  RefreshCw, 
  HelpCircle, 
  User, 
  Calendar 
} from "lucide-react";

interface WorkspaceFormsProps {
  token: string;
}

interface FormResponseItem {
  responseId: string;
  createTime: string;
  answers: {
    [questionId: string]: {
      questionId: string;
      textAnswers: {
        answers: { value: string }[];
      };
    };
  };
}

export default function WorkspaceForms({ token }: WorkspaceFormsProps) {
  // States
  const [createdFormId, setCreatedFormId] = useState("");
  const [createdFormUrl, setCreatedFormUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"viewer" | "creator">("viewer");

  // Query states
  const [formIdInput, setFormIdInput] = useState("");
  const [formInfo, setFormInfo] = useState<any>(null);
  const [responses, setResponses] = useState<FormResponseItem[]>([]);

  // status flags
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotif, setSuccessNotif] = useState("");

  const confirmAction = (text: string, onAgree: () => void) => {
    const doubleCheck = window.confirm(text);
    if (doubleCheck) {
      onAgree();
    }
  };

  // 1. Create a Google Form in user's Drive using Forms API
  const handleCreateFeedbackForm = async () => {
    setErrorMsg("");
    setSuccessNotif("");

    const message = `Create Google Form: Deploy a new customer feedback questionnaire named "NKT Towers Guest Experience Quiz" straight to your Google Drive?`;
    
    confirmAction(message, async () => {
      setIsCreating(true);
      try {
        // Step A: Create basic Form with Info items
        const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            info: {
              title: "NKT Nedumpurath Towers Customer Experience Survey",
              documentTitle: "NKT customer experience questionnaire"
            }
          })
        });

        if (!createRes.ok) throw new Error("Could not instantiate Form file on Drive.");
        const formObj = await createRes.json();
        const fId = formObj.formId;
        const fUrl = formObj.responderUri;

        // Step B: Set questions using batchUpdate
        // Google Forms API allows setting items using a batch update payload
        const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${fId}:batchUpdate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: [
              {
                createItem: {
                  item: {
                    title: "Rate your overall lease or charge station experience:",
                    description: "Select overall satisfaction.",
                    questionItem: {
                      question: {
                        required: true,
                        choiceQuestion: {
                          type: "RADIO",
                          options: [
                            { value: "Excellent" },
                            { value: "Good" },
                            { value: "Average" },
                            { value: "Needs Improvement" }
                          ]
                        }
                      }
                    }
                  },
                  location: { index: 0 }
                }
              },
              {
                createItem: {
                  item: {
                    title: "Provide additional feedback or suggestions below:",
                    questionItem: {
                      question: {
                        required: false,
                        textQuestion: { paragraph: true }
                      }
                    }
                  },
                  location: { index: 1 }
                }
              }
            ]
          })
        });

        if (!updateRes.ok) throw new Error("Failed to deploy questions list onto form template.");

        setCreatedFormId(fId);
        setCreatedFormUrl(fUrl);
        setFormIdInput(fId); // Auto load in query box
        setSuccessNotif(`Google Form fully deployed! ID: ${fId}`);
        fetchFormStructureAndResponses(fId);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to finalize Form template.");
      } finally {
        setIsCreating(false);
      }
    });
  };

  // 2. Fetch Form Details structure & responses
  const fetchFormStructureAndResponses = async (fId: string) => {
    if (!fId.trim()) return;
    setIsLoading(true);
    setErrorMsg("");
    setFormInfo(null);
    setResponses([]);

    try {
      // Step A: Fetch Form Structure Body
      const bodyRes = await fetch(`https://forms.googleapis.com/v1/forms/${fId.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!bodyRes.ok) throw new Error("Verification error: Unable to load Google Form details.");
      const bodyData = await bodyRes.json();
      setFormInfo(bodyData);

      // Step B: Fetch responses list
      // Note: Google Forms API gets responses under `/forms/{formId}/responses`
      const responsesRes = await fetch(`https://forms.googleapis.com/v1/forms/${fId.trim()}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (responsesRes.ok) {
        const respData = await responsesRes.json();
        setResponses(respData.responses || []);
      } else {
        // Form might have 0 responses, which is completely expected
        setResponses([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Coordinates query collapsed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Selector rails */}
      <div className="flex border-b border-white/5 pb-2 justify-start gap-4">
        <button
          id="forms-tab-viewer"
          onClick={() => setActiveTab("viewer")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === "viewer" ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:text-white"
          }`}
        >
          📋 Live Responses Monitor
        </button>
        <button
          id="forms-tab-generator"
          onClick={() => setActiveTab("creator")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === "creator" ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:text-white"
          }`}
        >
          ✨ Deploy New Google Form
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
              <ClipboardList className="w-4 h-4" /> Sync responses
            </h3>

            <div className="space-y-4 font-sans">
              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Google Form ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1FAIpQLSf..."
                  value={formIdInput}
                  onChange={(e) => setFormIdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>

              <button
                id="forms-sync-btn"
                onClick={() => fetchFormStructureAndResponses(formIdInput)}
                disabled={isLoading || !formIdInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )} Sync Form Responses
              </button>
            </div>
          </div>

          {/* Form responses results layout */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Header / Info box */}
            {formInfo && (
              <div className="p-4 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between gap-4 font-sans text-xs">
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">{formInfo.info?.title || "Unnamed Form"}</h4>
                  <p className="text-[10px] text-slate-400">Total item questions: {formInfo.items?.length || 0}</p>
                </div>
                {formInfo.responderUri && (
                  <a
                    href={formInfo.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/10 text-[10px] font-mono flex items-center gap-1 cursor-pointer shrink-0 uppercase"
                  >
                    View Form <ExternalLink className="w-3" />
                  </a>
                )}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[300px]">
              {isLoading ? (
                <div className="py-24 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span>Downloading questionnaire structures from Cloud Storage...</span>
                </div>
              ) : responses.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl bg-slate-950/20 flex flex-col items-center gap-3 font-sans">
                  <ClipboardList className="w-8 h-8 text-slate-700 animate-pulse" />
                  <span>No completed response submissions synchronized. Ready for polling.</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 no-scrollbar font-sans">
                  {responses.map((resp, idx) => (
                    <div key={resp.responseId} className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pb-1 border-b border-white/5">
                        <span className="flex items-center gap-1 uppercase font-bold text-cyan-400">
                          <User className="w-3 h-3" /> SUBMISSION #{idx + 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(resp.createTime).toLocaleDateString("en-IN", { hour: "numeric", minute: "numeric" })}
                        </span>
                      </div>

                      {/* Display answer keys */}
                      <div className="space-y-1.5 pt-0.5 text-xs">
                        {Object.keys(resp.answers || {}).map((qId) => {
                          const answerObj = resp.answers[qId];
                          const questionLabel = formInfo?.items?.find((item: any) => {
                            return item.questionItem?.question?.questionId === qId || item.itemId === qId;
                          })?.title || `Question ID: ${qId}`;
                          
                          const answerValues = answerObj.textAnswers?.answers?.map(a => a.value).join(", ") || "(Blank)";
                          
                          return (
                            <div key={qId} className="space-y-0.5 leading-relaxed">
                              <span className="text-[10px] text-slate-500 font-medium tracking-tight block">Q: {questionLabel}</span>
                              <span className="text-xs text-white font-semibold flex items-center gap-1.5 pl-1 pl">
                                <HelpCircle className="w-3 h-3 text-cyan-400 shrink-0" /> {answerValues}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="p-6 bg-slate-900 border border-white/5 rounded-2xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-indigo-500" />
          
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cyan-400" /> Form template Deployment Center
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Deploy fully interactive customer satisfaction quizzes directly onto your developer drive slot! Instantly create styled forms equipped with Multiple Choice ratings and Paragraph text suggestion fields.
            </p>
          </div>

          <div className="pt-3 max-w-lg space-y-4">
            <button
              id="forms-deploy-submit-btn"
              onClick={handleCreateFeedbackForm}
              disabled={isCreating}
              className="py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} Deploy Satisfaction Survey Form
            </button>

            {createdFormUrl && (
              <div className="p-4 bg-slate-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">Successfully Configured</span>
                <p className="text-xs text-white font-semibold flex items-center gap-1.5">
                  ID: <span className="font-mono text-cyan-300 select-all">{createdFormId}</span>
                </p>
                <a
                  href={createdFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline pt-1 cursor-pointer"
                >
                  OPEN DEPLOYED FORM IN NEW TAB <ExternalLink className="w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
