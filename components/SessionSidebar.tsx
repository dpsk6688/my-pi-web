'use client';
import { useEffect, useState } from "react";

export function SessionSidebar({ currentId, onSelect }: { currentId: string, onSelect: (id:string)=>void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => { fetch("/api/sessions").then(r=>r.json()).then(d=> setSessions(Array.isArray(d) ? d : [])); }, []);
  return (
    <div className="w-[260px] border-r border-zinc-800 bg-zinc-950 flex flex-col">
      <div className="p-3 font-bold flex justify-between text-sm"><span>my-pi-web v0.2</span><button onClick={()=>onSelect(crypto.randomUUID())} className="text-xs bg-white text-black px-2 py-1 rounded font-bold">+ 新会话</button></div>
      <div className="flex-1 overflow-auto">
        {sessions.map(s => (
          <div key={s.id} onClick={()=>onSelect(s.id)} className={`p-3 mx-2 my-1 rounded-xl cursor-pointer ${currentId===s.id ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
            <div className="text-sm truncate">{s.name || s.id.slice(0,8)}</div>
            <div className="text-[11px] opacity-50 truncate">{s.cwd || ""}</div>
          </div>
        ))}
        {sessions.length===0 && <div className="p-3 text-xs opacity-40">本地模式：会话仅保存在内存，Fork 可复制。无需 ~/.pi/agent</div>}
      </div>
      <div className="p-3 text-[10px] opacity-30">完整版 | 文件 | 工具 | Fork | 成本统计</div>
    </div>
  );
}
