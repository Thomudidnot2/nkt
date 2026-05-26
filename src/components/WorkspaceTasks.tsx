import React, { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  FolderPlus, 
  CheckCircle2, 
  Calendar, 
  FileText 
} from "lucide-react";

interface TaskList {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  status: "completed" | "needsAction";
  notes?: string;
  due?: string;
  updated?: string;
}

interface WorkspaceTasksProps {
  token: string;
}

export default function WorkspaceTasks({ token }: WorkspaceTasksProps) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Loaders & Errors
  const [isListsLoading, setIsListsLoading] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotif, setSuccessNotif] = useState("");

  // Create Task Forms Form fields
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  
  // Create Task List Form fields
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");

  // 1. Fetch Lists of Tasks
  const fetchTaskLists = async () => {
    setIsListsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch Task categories.");
      const data = await res.json();
      const lists = data.items || [];
      setTaskLists(lists);
      if (lists.length > 0 && !selectedListId) {
        setSelectedListId(lists[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to catalog Google task lists.");
    } finally {
      setIsListsLoading(false);
    }
  };

  // 2. Fetch Tasks inside selected list
  const fetchTasks = async (listId: string) => {
    if (!listId) return;
    setIsTasksLoading(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch task records.");
      const data = await res.json();
      setTasks(data.items || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load individual tasks.");
    } finally {
      setIsTasksLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTaskLists();
    }
  }, [token]);

  useEffect(() => {
    if (selectedListId && token) {
      fetchTasks(selectedListId);
    }
  }, [selectedListId, token]);

  // 3. Create Task List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || isMutating) return;

    setIsMutating(true);
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: newListName.trim() })
      });

      if (!res.ok) throw new Error("Could not instantiate Task list folder.");
      const newList = await res.json();
      setTaskLists((prev) => [...prev, newList]);
      setSelectedListId(newList.id);
      setNewListName("");
      setShowAddList(false);
      setSuccessNotif(`Successfully created folder "${newList.title}"!`);
      setTimeout(() => setSuccessNotif(""), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to construct task collection.");
    } finally {
      setIsMutating(false);
    }
  };

  // 4. Create Task (with User Confirmation)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId || isMutating) return;

    const listName = taskLists.find((l) => l.id === selectedListId)?.title || "selected list";
    toastConfirmation(
      `Confirm action: Would you like to create task details "${newTaskTitle}" straight inside your Google tasks list "${listName}"?`,
      async () => {
        setIsMutating(true);
        try {
          const bodyPayload: any = {
            title: newTaskTitle.trim(),
            status: "needsAction"
          };
          if (newTaskNotes.trim()) bodyPayload.notes = newTaskNotes.trim();
          if (newTaskDue) bodyPayload.due = new Date(newTaskDue).toISOString();

          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyPayload)
          });

          if (!res.ok) throw new Error("Failed to insert task.");
          setNewTaskTitle("");
          setNewTaskNotes("");
          setNewTaskDue("");
          fetchTasks(selectedListId);
          setSuccessNotif("Google Task created!");
          setTimeout(() => setSuccessNotif(""), 3500);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || "Could not publish task.");
        } finally {
          setIsMutating(false);
        }
      }
    );
  };

  // helper confirmation wrapper
  const toastConfirmation = (text: string, onConfirm: () => void) => {
    const confirmation = window.confirm(text);
    if (confirmation) {
      onConfirm();
    }
  };

  // 5. Update Task Status (Toggle Checkbox with User Confirmation)
  const handleToggleTaskStatus = async (task: Task) => {
    if (isMutating) return;

    const futureStatus = task.status === "completed" ? "needsAction" : "completed";
    const statusLabel = futureStatus === "completed" ? "Complete" : "Re-open";

    toastConfirmation(
      `Confirm action: Set status to "${statusLabel}" for active task "${task.title}" on Google Tasks servers?`,
      async () => {
        setIsMutating(true);
        try {
          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${task.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: task.id,
              status: futureStatus
            })
          });

          if (!res.ok) throw new Error("Verification patch failed.");
          fetchTasks(selectedListId);
          setSuccessNotif("Google Task status adjusted!");
          setTimeout(() => setSuccessNotif(""), 3500);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || "Failed to update status.");
        } finally {
          setIsMutating(false);
        }
      }
    );
  };

  // 6. Delete Task (Mandatory User Confirmation dialog)
  const handleDeleteTask = async (task: Task) => {
    const confirmationText = `Are you absolutely certain you want to DELETE task "${task.title}" permanently from Google Tasks servers? This action cannot be reverted.`;
    
    // Explicit Confirmation Dialogue
    toastConfirmation(confirmationText, async () => {
      setIsMutating(true);
      try {
        const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${task.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Could not dispatch delete command.");
        fetchTasks(selectedListId);
        setSuccessNotif("Task wiped successfully.");
        setTimeout(() => setSuccessNotif(""), 3500);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to remove task.");
      } finally {
        setIsMutating(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Alert indicators */}
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

      {/* Selector and Task control block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actions side column */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 space-y-4 h-fit">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Active Task Category/List
            </label>
            <div className="flex gap-2">
              {isListsLoading ? (
                <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Spinning lists...
                </div>
              ) : (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 font-sans cursor-pointer"
                >
                  {taskLists.map((list) => (
                    <option key={list.id} value={list.id} className="bg-slate-950 text-white">
                      📋 {list.title}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                id="tasks-add-list-toggle"
                onClick={() => setShowAddList(!showAddList)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  showAddList 
                    ? "bg-cyan-500 text-slate-950 border-cyan-500" 
                    : "bg-slate-950 border-white/10 text-cyan-400 hover:border-cyan-500/30"
                }`}
                title="Create a new task folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Add List Panel */}
          {showAddList && (
            <form onSubmit={handleCreateList} className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-2 animate-fade-in">
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider block">New Google List Folder</span>
              <input
                type="text"
                placeholder="Folder title, e.g. Idukki Project"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                required
              />
              <button
                id="tasks-submit-list-btn"
                type="submit"
                disabled={isMutating}
                className="w-full py-1 text-[10px] font-bold tracking-wider font-mono rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 uppercase cursor-pointer flex items-center justify-center gap-1"
              >
                {isMutating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Build List
              </button>
            </form>
          )}

          <div className="border-t border-white/5 pt-3">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1 mt-1 mb-3">
              <CheckSquare className="w-4 h-4" /> Commit Task details
            </h4>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  placeholder="Task Description"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-sans font-medium"
                  required
                />
              </div>

              <div>
                <textarea
                  placeholder="Notes, references or checklists..."
                  rows={2}
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 font-sans select-none cursor-pointer"
                  />
                </div>
              </div>

              <button
                id="tasks-submit-task-btn"
                type="submit"
                disabled={isMutating || !selectedListId}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isMutating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )} Sync Google Task
              </button>
            </form>
          </div>

        </div>

        {/* Task lists table details list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
              Task Matrix Ledger
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Real-time Sync Active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[400px]">
            {isTasksLoading ? (
              <div className="py-24 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Downloading Google Tasks from cloud repositories...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl bg-slate-950/20 flex flex-col items-center gap-3">
                <CheckSquare className="w-8 h-8 text-slate-700 animate-pulse" />
                No tasks available under this folder category yet. Create some inside the composer side to begin!
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                {tasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  return (
                    <div
                      key={task.id}
                      id={`tasks-row-${task.id}`}
                      className={`p-3.5 rounded-xl bg-slate-950/80 border transition-all hover:bg-slate-950 flex items-center justify-between gap-4 ${
                        isCompleted ? "border-emerald-500/10 opacity-70" : "border-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Checkbox Trigger */}
                        <button
                          id={`tasks-checkbox-${task.id}`}
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={isMutating}
                          className="mt-0.5 text-cyan-400 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
                        >
                          {isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 hover:text-cyan-400" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold transition-all truncate text-white leading-normal ${
                            isCompleted ? "line-through text-slate-550 text-slate-500" : ""
                          }`} title={task.title}>
                            {task.title}
                          </h4>
                          
                          {task.notes && (
                            <p className="text-[10px] text-slate-400 leading-normal mt-0.5 break-words max-w-[400px]">
                              {task.notes}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-500">
                            {task.due && (
                              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/20 border border-amber-950 px-1.5 py-0.5 rounded">
                                <Calendar className="w-2.5 h-2.5" /> Due: {new Date(task.due).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {task.updated && (
                              <span>Synced: {new Date(task.updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete command */}
                      <button
                        id={`tasks-delete-${task.id}`}
                        onClick={() => handleDeleteTask(task)}
                        disabled={isMutating}
                        className="p-1 px-2.5 rounded-lg bg-red-950/20 hover:bg-red-900 border border-red-550/10 text-red-400 transition-all cursor-pointer text-[10px] font-mono font-semibold tracking-wider flex items-center gap-1 shrink-0"
                        title="Wipe task"
                      >
                        WIPE <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
