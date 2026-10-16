'use client';
import { useAgentSession } from "@/hooks/useAgentSession";
import { useEffect, useRef } from "react";

export function ChatWindow({ sessionId, onFork }: { sessionId: string, onFork: (newId:string)=>void }) {
  const { messages, streaming, input, setInput, send } = useAgentSession(sessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, streaming]);

  async function handleFork() {
    const res = await fetch(`/api/agent/${sessionId}`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action: "fork" }) });
    const data = await res.json();
    if (data.newId) { onFork(data.newId); }
  }

  function renderTool(tc:any) {
    const name = tc.toolName;
    const inp = tc.input || {};
    const out = tc.result ? String(tc.result).slice(0,2000) : "";
    const icon = name==='write_file' ? '📝' : name==='run_command' ? '⚡' : name==='read_file' ? '📖' : name==='list_files' ? '📁' : '🔧';
    const color = name==='write_file' ? 'border-emerald-500/30 bg-emerald-500/10' : name==='run_command' ? 'border-amber-500/30 bg-amber-500/10' : name==='read_file' ? 'border-blue-500/30 bg-blue-500/10' : 'border-zinc-700 bg-zinc-900';
    return (
      <div key={tc.toolCallId} className={`mt-2 rounded-xl border px-3 py-2 text-[11px] font-mono ${color}`}>
        <div className="flex items-center gap-2">
          <span>{icon}</span><span className="font-bold">{name}</span>
          <span className="opacity-60 truncate">{name==='write_file' ? inp.path : name==='run_command' ? inp.command : inp.path || ''}</span>
        </div>
        {out && <pre className="mt-2 bg-black/50 rounded-lg p-2 overflow-auto max-h-[200px] text-[10px] whitespace-pre-wrap">{out}</pre>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {messages.length===0 && (
          <div className="max-w-[600px] mx-auto mt-8">
            <div className="text-2xl font-black">my-pi-web v1.2</div>
            <div className="text-sm opacity-60 mt-2">本地离线 • qwen2.5-coder • 真实文件 + 命令执行</div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="text-xs font-bold">💡 快速开始</div>
                <div className="mt-2 space-y-1 text-[11px] opacity-70 font-mono">
                  <div className="hover:bg-white/5 p-1 rounded cursor-pointer" onClick={()=>setInput('列出 app 目录文件')}>列出 app 目录文件</div>
                  <div className="hover:bg-white/5 p-1 rounded cursor-pointer" onClick={()=>setInput('读取 app/calc/page.tsx')}>读取 app/calc/page.tsx</div>
                  <div className="hover:bg-white/5 p-1 rounded cursor-pointer" onClick={()=>setInput('创建一个登录页到 app/login/page.tsx，渐变玻璃，炫酷，必须调用 write_file 工具')}>创建一个登录页到 app/login/page.tsx</div>
                  <div className="hover:bg-white/5 p-1 rounded cursor-pointer" onClick={()=>setInput('执行 npm run build 检查错误，必须调用 run_command')}>执行 npm run build 检查错误</div>
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="text-xs font-bold">🔧 v1.2 新能力</div>
                <div className="mt-2 space-y-1 text-[11px] opacity-70">
                  <div>✅ run_command 可视化（黄）</div>
                  <div>✅ write_file 可视化（绿）</div>
                  <div>✅ 多轮自动修正 5轮</div>
                  <div>✅ 项目上下文注入</div>
                  <div>✅ 自动滚动 + 文件预览</div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px]">
              ⚠️ 确保 Ollama 在跑：<code className="bg-black px-1 rounded">ollama serve</code> + <code className="bg-black px-1 rounded">ollama run qwen2.5-coder:7b</code>
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={m.role==="user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[88%] rounded-[20px] px-4 py-3 text-sm ${m.role==="user" ? "bg-white text-black" : "bg-zinc-800/80 backdrop-blur text-zinc-100 border border-zinc-700/50"}`}>
              <div className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: m.content.replace(/```([\s\S]*?)```/g, '<pre style="background:#111;padding:10px;border-radius:12px;overflow:auto;margin:8px 0;font-size:12px;border:1px solid #222">$1</pre>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
              {m.toolCalls && m.toolCalls.length>0 && (
                <div className="mt-2 space-y-2">
                  {m.toolCalls.map((tc:any)=>renderTool(tc))}
                </div>
              )}
            </div>
          </div>
        ))}
        {streaming && <div className="flex items-center gap-2 text-xs opacity-50"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/><span>本地 Agent 执行中...</span></div>}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-zinc-800/50 bg-zinc-900/50 backdrop-blur flex gap-2">
        <button onClick={handleFork} title="Fork 会话" className="bg-zinc-800 hover:bg-zinc-700 text-xs px-3 py-3 rounded-xl transition">🍴 Fork</button>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && !e.shiftKey && send()}
          placeholder="列出文件 / 读取 xxx / 创建文件 xxx / 执行命令..." className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-white text-sm" />
        <button onClick={()=>send()} disabled={streaming} className="bg-white text-black rounded-xl px-6 py-3 font-bold disabled:opacity-50 text-sm hover:bg-zinc-200 transition">发送</button>
      </div>
    </div>
  );
}
