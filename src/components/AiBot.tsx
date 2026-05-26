import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, X, MessageSquare, AlertCircle } from "lucide-react";

export default function AiBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "Greetings! I am George's Digital AI Agent. Ask me anything about the **NKT Group**, our heritage **N.K.T. Vessels House (est. 1947)**, our **90kW DC IonGrid EV Charge Hub**, or how we orchestrate real estate workflows using agentic AI."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the digital architect server.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I encountered a minor routing deviation in my digital grid. Please make sure the backend is active!"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Launcher Button */}
      <motion.button
        id="ai-bot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold shadow-lg shadow-cyan-500/20 pointer-events-auto cursor-pointer"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-sans">Ask NKT Assistant</span>
      </motion.button>

      {/* Chat Window Glass Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-bot-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-[90vw] sm:w-[420px] h-[550px] rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div>
                  <h3 className="font-sans font-semibold text-sm text-white">NKT Group Assistant</h3>
                  <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">Polite Virtual Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Chat History */}
            <div
              ref={scrollRef}
              className="flex-1 p-5 overflow-y-auto space-y-4 font-sans text-sm text-slate-300"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100 rounded-tr-none"
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "bot" ? (
                      <div className="space-y-1 whitespace-pre-line prose prose-invert prose-sm">
                        {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="text-xs font-mono text-slate-500 ml-1">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-slate-900/60 border-t border-white/10 flex gap-2.5"
            >
              <input
                id="ai-bot-input-field"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. tell me about the EV hub"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                id="ai-bot-submit-btn"
                type="submit"
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-all cursor-pointer flex items-center justify-center shadow-md shadow-cyan-500/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
