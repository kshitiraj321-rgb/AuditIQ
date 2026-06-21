"use client";

import { useState, useRef, useEffect } from "react";
import { askAssistant, ChatMessage } from "@/lib/assistant/assistantService";

interface InvestigationAssistantProps {
  analysisResult: any;
  selectedIdx: number;
}

export function InvestigationAssistant({
  analysisResult,
  selectedIdx,
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
    const selectedException = analysisResult.exceptions[selectedIdx];
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
  }, [selectedIdx, analysisResult.exceptions, analysisResult.recommendations]);

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
        selectedIdx,
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
    <div className="flex flex-col h-[400px] bg-white border rounded-lg overflow-hidden mt-4">
      <div className="bg-gray-50 border-b px-5 py-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 flex items-center gap-2">
          <span>🤖</span> Investigation Assistant
        </h2>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
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
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-500 flex items-center gap-2">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse animation-delay-200">●</span>
              <span className="animate-pulse animation-delay-400">●</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3 bg-white">
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
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
