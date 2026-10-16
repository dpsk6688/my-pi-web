
"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant" | "tool"; content: string; toolName?: string; isError?: boolean };

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "my-pi-web v1.3 本地离线 • OLLAMA 7B\n\n你好！我是本地离线编程助手，完全跑在你电脑上。\n\n试试：\n• 列出 app 目录文件\n• 读取 app/login/page.tsx\n• 创建一个xxx页面"}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(16).slice(2,10));
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [msgs]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setMsgs(m => [...m, { role: "user", content: t }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ message: t, sessionId })
      });
      const data = await res.json();
      // data may be { messages: [...] } or single
      const incoming: Msg[] = [];
      if (Array.isArray(data.messages)) {
        for (const mm of data.messages) {
          if (mm.tool_call) {
            incoming.push({ role: "assistant", content: `🔧 ${mm.tool_call.name} ${JSON.stringify(mm.tool_call.arguments)}`, toolName: mm.tool_call.name });
          } else if (mm.tool_result) {
            const c = typeof mm.tool_result === "string" ? mm.tool_result : JSON.stringify(mm.tool_result, null, 2);
            incoming.push({ role: "tool", content: c.slice(0, 8000), toolName: mm.tool_name, isError: mm.is_error });
          } else if (mm.content) {
            incoming.push({ role: "assistant", content: mm.content });
          }
        }
      } else if (data.content) {
        incoming.push({ role: "assistant", content: data.content });
      } else {
        incoming.push({ role: "assistant", content: JSON.stringify(data).slice(0,5000) });
      }
      setMsgs(m => [...m, ...incoming]);
    } catch (e:any) {
      setMsgs(m => [...m, { role: "assistant", content: "❌ 请求失败: "+ e.message, isError:true }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 flex flex-col">
      <header className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between sticky top-0 bg-[#0a0a0f]/80 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold">my-pi-web v1.3 新会话</span>
          <span className="text-xs text-zinc-400 hidden sm:inline">本地模式：会话仅保存在内存，Fork 可复制。无需 ~/.pi/agent</span>
        </div>
        <div className="text-xs text-zinc-500">Session: {sessionId} | v1.3 本地离线 • OLLAMA 7B • run_command ✅ <a href="/" className="ml-2 underline">🏠 首页</a></div>
      </header>

      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-4 max-w-4xl w-full mx-auto">
        {msgs.map((m,i)=>(
          <div key={i} className={`rounded-xl p-4 border ${m.role==="user" ? "bg-zinc-900 border-zinc-800 ml-12" : m.role==="tool" ? (m.isError?"bg-red-950/40 border-red-800":"bg-emerald-950/30 border-emerald-800") : "bg-[#14141f] border-zinc-800 mr-12"}`}>
            <div className="text-[11px] opacity-60 mb-1">{m.role==="user"?"你": m.role==="tool" ? `🔧 ${m.toolName || "tool"} 结果` : "助手"} {m.isError?"❌":""}</div>
            <pre className="whitespace-pre-wrap break-words text-[13px] leading-6 font-mono">{m.content}</pre>
          </div>
        ))}
        {loading && <div className="text-zinc-500 text-sm">⏳ Ollama 思考中...</div>}
      </div>

      <div className="border-t border-zinc-800 p-3 bg-[#0a0a0f] sticky bottom-0">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(input);} }} placeholder="列出文件 / 读取 xxx / 创建文件 xxx / 执行命令..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-violet-600" />
          <button onClick={()=>send(input)} disabled={loading} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-6 rounded-lg text-sm font-medium">发送</button>
        </div>
      </div>
    </div>
  );
}
