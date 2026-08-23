"use client";
export const dynamic = "force-dynamic";
// Civi AI Chat Assistant — Civitas Atlas Technologies Pvt. Ltd., Pune
import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Send, Loader2, ArrowLeft, User, Sparkles, AlertCircle } from "lucide-react";
import CiviAIIcon from "@/components/CiviAIIcon";
import { useRouter } from "next/navigation";

interface Message {
  role:      "user" | "assistant";
  content:   string;
  timestamp: Date;
}

const STARTERS = [
  "Which products can I manufacture right now?",
  "What raw materials need urgent restocking?",
  "Give me this week's replenishment plan",
  "Which items have the highest consumption rate?",
  "Summarize current inventory health",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-purple-500"
          style={{
            animation: "bounce 1.4s infinite ease-in-out",
            animationDelay: `${i * 0.16}s`,
          }} />
      ))}
    </div>
  );
}

export default function CiviAIChatPage() {
  const router = useRouter();
  const [messages,  setMessages]  = useState<Message[]>([
    {
      role:      "assistant",
      content:   "Hello! I'm **Civi AI**, your inventory assistant.\n\nI analyse real-time stock levels, manufacture readiness, and replenishment needs. Ask me anything about your inventory.",
      timestamp: new Date(),
    },
  ]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("s2r2_token") || "" : "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/intelligence/chat", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          message:  text.trim(),
          history:  messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role:      "assistant",
        content:   data.reply || "I couldn't generate a response.",
        timestamp: new Date(),
      }]);
    } catch (err: unknown) {
      setError((err as Error).message || "Connection failed");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-1" />;

      // Bullet
      if (/^[-•*]\s/.test(trimmed)) {
        const clean = trimmed.replace(/^[-•*]\s/, "").replace(/\*\*(.*?)\*\*/g, "$1");
        return (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-400 shrink-0" />
            <span>{clean}</span>
          </div>
        );
      }

      // Bold-only heading
      if (trimmed.match(/^\*\*(.+?)\*\*$/)) {
        return <p key={i} className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-2">{trimmed.replace(/\*\*/g, "")}</p>;
      }

      // Normal with inline bold
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-sm">
          {parts.map((part, pi) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={pi} className="font-semibold">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    });
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto">

        {/* Header */}
        <div className="shrink-0 mb-3 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #581c87 0%, #7c3aed 100%)" }}>
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition">
              <ArrowLeft size={16}/>
            </button>
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <CiviAIIcon size={20} animated />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Civi AI Assistant</p>
              <p className="text-purple-200 text-xs">Inventory Intelligence · Civitas Atlas</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              Live
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="shrink-0 mb-3 flex items-start gap-2 px-3 py-2 rounded-lg
                        bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <AlertCircle size={12} className="text-purple-500 shrink-0 mt-0.5"/>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-snug">
            AI responses are for evaluation only. Verify with actual data before decisions.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 px-1 mb-3">
          {messages.map((msg, idx) => (
            <div key={idx}
              className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-purple-600 to-purple-800"
                  : "bg-gray-200 dark:bg-gray-700"}`}>
                {msg.role === "assistant"
                  ? <CiviAIIcon size={15} animated={false} className="text-white" />
                  : <User  size={13} className="text-gray-600 dark:text-gray-300"/>}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] rounded-xl px-3 py-2 space-y-0.5 ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-sm"
                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm"
              }`}>
                {msg.role === "assistant"
                  ? <div className="space-y-0.5">{renderContent(msg.content)}</div>
                  : <p className="text-sm">{msg.content}</p>}
                <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-purple-200" : "text-gray-400"}`}>
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <CiviAIIcon size={15} animated className="text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl rounded-bl-sm shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
              <AlertCircle size={12} className="shrink-0"/>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && !loading && (
          <div className="shrink-0 mb-3">
            <p className="text-xs text-gray-400 mb-2 text-center">Quick questions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800
                             text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20
                             hover:bg-purple-100 dark:hover:bg-purple-900/40 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="shrink-0 flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800
                     border border-purple-200 dark:border-purple-800 shadow-sm">
          <Sparkles size={16} className="text-purple-400 shrink-0 ml-1"/>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about inventory..."
            disabled={loading}
            autoFocus
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200
                       placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #581c87, #7c3aed)" }}>
            {loading
              ? <Loader2 size={15} className="text-white animate-spin"/>
              : <Send    size={15} className="text-white"/>}
          </button>
        </form>

      </div>
    </AppShell>
  );
}
