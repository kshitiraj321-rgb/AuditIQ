"use client";

import { useState, useRef, useEffect } from "react";
import { askAssistant, ChatMessage } from "@/lib/assistant/assistantService";
import { Tag } from "@/components/presentation";

interface InvestigationAssistantProps {
  analysisResult: any;
  selectedException: {
    type: string;
    severity: string;
    message?: string;
  } | null;
}

export function InvestigationAssistant({
  analysisResult,
  selectedException,
}: InvestigationAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Reset or add context message when switching exceptions
  useEffect(() => {
    if (selectedException) {
      const allRecs = analysisResult.recommendations || [];
      const relevantRec = allRecs.find((rec: string) => 
        rec.toLowerCase().includes(selectedException.type.toLowerCase())
      );
      
      const nextActions = [
        relevantRec || "Review the exception details and associated documents.",
        "Verify standard operating procedures for this exception type.",
        "If required, escalate to the appropriate approval authority."
      ];
      
      const actionsList = nextActions.map((act, i) => `${i + 1}. ${act}`).join("\n");

      setMessages([
        {
          role: "assistant",
          content: `I am ready to help investigate the **${selectedException.type}** exception.\n\n**Suggested Next Actions:**\n${actionsList}`,
        },
      ]);
    }
  }, [selectedException, analysisResult.recommendations]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const responseContent = await askAssistant(
        userMessage.content,
        analysisResult,
        selectedException,
        messages
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseContent },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error communicating with the assistant." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2 flex h-[440px] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(14,165,233,0.04))] px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Investigation assistant
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">Guided case analysis</p>
        </div>
        <Tag tone="accent">Live context</Tag>
      </div>

      <div
        className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4"
        ref={scrollRef}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                msg.role === "user"
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        {messages.length === 1 && (
          <div className="mb-3 flex flex-wrap gap-2 px-1">
            {["Explain this finding", "Show extracted fields", "Why was this detected", "Summarize investigation"].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setInput(suggestion);
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this exception..."
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
