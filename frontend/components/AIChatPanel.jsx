import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useTripStore } from "../store/useTripStore";

const QUICK_PROMPTS = [
  "What should I pack?",
  "Best local food to try?",
  "How to get around?",
  "Currency & tipping tips?",
  "Safety advice?",
  "Hidden gems to visit?",
];

export default function AIChatPanel({ tripId, destination }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hi! I'm your AI travel assistant for your **${destination}** trip. Ask me anything — packing tips, local cuisine, transport, safety, or hidden gems! 🌍`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await useTripStore.getState().sendChatMessage(tripId, msg);
      setMessages(prev => [...prev, { role: "assistant", text: reply || "Sorry, I couldn't get a response. Please try again!" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Please try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full text-white font-bold text-sm shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #8b9c86, #6d7c69)",
          boxShadow: "0 8px 25px rgba(139,156,134,0.5)",
          fontFamily: "'Inter', sans-serif",
          display: open ? "none" : "flex"
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Ask AI
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl"
            style={{
              width: "min(380px, calc(100vw - 1.5rem))",
              height: "min(520px, calc(100dvh - 6rem))",
              fontFamily: "'Inter', sans-serif",
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ background: "linear-gradient(135deg, #1a2318, #2d3d2a)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139,156,134,0.3)" }}>
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">AI Trip Assistant</p>
                  <p className="text-[10px] font-medium" style={{ color: "#8b9c86" }}>{destination}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mr-2 mt-0.5 self-start"
                      style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "text-slate-700 rounded-tl-sm"
                    }`}
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }
                      : { background: "#f8f6f2", border: "1px solid rgba(0,0,0,0.06)" }
                    }
                  >
                    {/* Simple markdown bold */}
                    {msg.text.split("**").map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex gap-1 px-3 py-2.5 rounded-2xl rounded-tl-sm"
                    style={{ background: "#f8f6f2", border: "1px solid rgba(0,0,0,0.06)" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "#8b9c86", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {QUICK_PROMPTS.slice(0, 4).map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap"
                    style={{ borderColor: "rgba(139,156,134,0.3)", color: "#6d7c69", background: "rgba(139,156,134,0.06)" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask about your trip..."
                  className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-xs outline-none transition-all"
                  style={{
                    background: "#f5f1ea",
                    border: "1.5px solid rgba(0,0,0,0.08)",
                    maxHeight: "80px",
                    fontFamily: "'Inter', sans-serif"
                  }}
                />
                <button type="submit" disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
