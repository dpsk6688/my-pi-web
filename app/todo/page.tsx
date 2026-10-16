'use client';
import { useState, useEffect } from "react";
type Todo = { id: number; text: string; done: boolean };
export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  useEffect(()=>{ const s=localStorage.getItem("my-pi-todos-v1"); if(s) setTodos(JSON.parse(s)); },[]);
  useEffect(()=>{ localStorage.setItem("my-pi-todos-v1", JSON.stringify(todos)); },[todos]);
  const add = ()=>{ if(!input.trim()) return; setTodos(t=>[...t,{id:Date.now(),text:input.trim(),done:false}]); setInput(""); };
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white/15 backdrop-blur-2xl rounded-[28px] p-6 border border-white/20 shadow-2xl">
        <div className="text-white font-bold text-xl mb-4">✨ 待办 v1.0</div>
        <div className="flex gap-2 mb-4">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="添加任务..." className="flex-1 bg-white/90 rounded-2xl px-4 py-3 outline-none" />
          <button onClick={add} className="bg-white text-emerald-600 font-bold rounded-2xl px-5 active:scale-95 transition">+</button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {todos.map(t=>(
            <div key={t.id} className="bg-white/90 rounded-2xl px-4 py-3 flex items-center gap-3 animate-[fadeIn_0.3s]">
              <button onClick={()=>setTodos(s=>s.map(x=>x.id===t.id?{...x,done:!x.done}:x))} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${t.done?'bg-emerald-500 border-emerald-500 text-white':''}`}>{t.done?'✓':''}</button>
              <span className={`flex-1 ${t.done?'line-through opacity-50':''}`}>{t.text}</span>
              <button onClick={()=>setTodos(s=>s.filter(x=>x.id!==t.id))} className="text-red-400">×</button>
            </div>
          ))}
        </div>
        <div className="text-white/50 text-[10px] mt-4 text-center">{todos.filter(t=>!t.done).length} pending • 本地存储 • my-pi-web v1.0</div>
      </div>
    </div>
  );
}
