'use client';
import { useState } from "react";

type ToolCall = { toolCallId: string; toolName: string; input: any; output?: string };
type Msg = { role: "user" | "assistant"; content: string; id: string; toolCalls?: ToolCall[] };

export function useAgentSession(sessionId: string) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState({ count: 0, cost: 0 });

  async function send() {
    if (!input.trim() || streaming) return;
    const text = input;
    setInput("");
    const userMsg: Msg = { role: "user", content: text, id: Math.random().toString(36).slice(2) };
    const assistantId = Math.random().toString(36).slice(2);
    setMessages(m => [...m, userMsg, { role: "assistant", content: "", id: assistantId, toolCalls: [] }]);
    setStreaming(true);

    try {
      const res = await fetch(`/api/agent/${sessionId}/events?message=${encodeURIComponent(text)}`);
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentToolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: msg.content + data.text } : msg));
            } else if (data.type === 'tool_call') {
              const tc = { toolCallId: Math.random().toString(36).slice(2), toolName: data.tool, input: data.args };
              currentToolCalls.push(tc);
              setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, toolCalls: [...currentToolCalls] } : msg));
            } else if (data.type === 'tool_result') {
              if (data.tool === 'write_file') setRefreshKey(k=>k+1);
              setMessages(prev => prev.map(msg => {
                if (msg.id !== assistantId) return msg;
                const tcs = (msg.toolCalls||[]).map(tc => tc.toolName===data.tool && !tc.output ? { ...tc, output: JSON.stringify(data.result).slice(0,500) } : tc);
                return { ...msg, toolCalls: tcs };
              }));
            }
          } catch {}
        }
      }
    } catch (e:any) {
      setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: msg.content + "\n[Error] " + e.message } : msg));
    }
    setStreaming(false);
  }

  return { messages, streaming, input, setInput, send, stats, refreshKey };
}
