'use client';
import { useState } from "react";

const sections = [
  { id: "start", title: "快速开始", icon: "🚀", color: "from-violet-500 to-purple-600", content: `
    <h3 class="font-bold text-lg mb-2">一键启动</h3>
    <p class="opacity-80 text-sm mb-3">Windows 双击 start.bat，Mac/Linux 执行 ./start.sh</p>
    <div class="bg-black/40 rounded-xl p-3 font-mono text-xs">
      <div>ollama pull qwen2.5-coder:7b</div>
      <div>npm install</div>
      <div>npm run dev → http://localhost:30141</div>
    </div>
  `},
  { id: "ui", title: "界面说明", icon: "🖥️", color: "from-blue-500 to-cyan-500", content: `
    <h3 class="font-bold text-lg mb-2">三栏复刻 pi</h3>
    <div class="grid grid-cols-3 gap-2 text-xs">
      <div class="bg-white/10 rounded-xl p-2"><div class="font-bold">左侧</div>会话列表<br/>新会话/Fork</div>
      <div class="bg-white/10 rounded-xl p-2"><div class="font-bold">中部</div>对话流<br/>🔧 tool可视化</div>
      <div class="bg-white/10 rounded-xl p-2"><div class="font-bold">右侧</div>文件树<br/>实时刷新</div>
    </div>
  `},
  { id: "magic", title: "核心咒语", icon: "✨", color: "from-fuchsia-500 to-pink-600", content: `
    <h3 class="font-bold text-lg mb-2">7b 必须加咒语</h3>
    <div class="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-sm">
      <div class="font-mono font-bold">必须调用 write_file 工具</div>
      <div class="opacity-70 mt-1">不加 → 只展示代码不写文件</div>
      <div class="opacity-70">加了 → 真实写入硬盘 ✅</div>
    </div>
    <div class="mt-3 bg-black/30 rounded-xl p-2 font-mono text-[11px]">创建一个登录页到 app/login/page.tsx，渐变背景，必须调用 write_file 工具</div>
  `},
  { id: "tools", title: "内置工具", icon: "🔧", color: "from-emerald-500 to-teal-600", content: `
    <div class="space-y-2 text-sm">
      <div class="flex gap-2"><span class="bg-white/20 rounded px-2 py-1 font-mono text-xs">list_files</span><span class="opacity-70">列目录</span></div>
      <div class="flex gap-2"><span class="bg-white/20 rounded px-2 py-1 font-mono text-xs">read_file</span><span class="opacity-70">读文件</span></div>
      <div class="flex gap-2"><span class="bg-white/20 rounded px-2 py-1 font-mono text-xs">write_file</span><span class="opacity-70">写文件，自动建目录</span></div>
    </div>
  `},
  { id: "pages", title: "示例页面", icon: "📦", color: "from-orange-500 to-red-500", content: `
    <div class="grid grid-cols-3 gap-2">
      <a href="/calc" class="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition"><div class="text-2xl">🧮</div><div class="text-xs mt-1">/calc 计算器</div></a>
      <a href="/todo" class="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition"><div class="text-2xl">✅</div><div class="text-xs mt-1">/todo 待办</div></a>
      <a href="/weather" class="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition"><div class="text-2xl">⛅</div><div class="text-xs mt-1">/weather 天气</div></a>
    </div>
  `},
  { id: "faq", title: "常见问题", icon: "❓", color: "from-slate-600 to-slate-800", content: `
    <div class="space-y-2 text-xs">
      <div><b>params should be awaited</b><br/><span class="opacity-60">v1.0 已修复，重新下载 route.ts</span></div>
      <div><b>一直 mock</b><br/><span class="opacity-60">Ctrl+Shift+R 强制刷新</span></div>
      <div><b>Ollama 连接失败</b><br/><span class="opacity-60">确认 ollama serve 在跑</span></div>
      <div><b>next 不是命令</b><br/><span class="opacity-60">npm install 没执行</span></div>
    </div>
  `},
];

export default function ManualPage() {
  const [active, setActive] = useState("start");
  const cur = sections.find(s=>s.id===active)!;
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <div className="w-[260px] border-r border-white/10 p-4 hidden md:block">
        <div className="font-black text-xl tracking-tight">my-pi-web</div>
        <div className="text-[10px] opacity-50 tracking-widest">MANUAL v1.0</div>
        <div className="mt-6 space-y-1">
          {sections.map(s=>(
            <button key={s.id} onClick={()=>setActive(s.id)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition ${active===s.id?`bg-gradient-to-r ${s.color} text-white shadow-lg`:'hover:bg-white/10 opacity-70'}`}>
              <span>{s.icon}</span>{s.title}
            </button>
          ))}
        </div>
        <div className="mt-8 p-3 bg-white/5 rounded-xl text-[11px] opacity-60">
          <div>本地离线</div><div>Ollama 7b</div><div>不花钱不上传</div>
          <div className="mt-2"><a href="/" className="text-violet-400">← 返回对话</a></div>
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-2 p-3 overflow-auto border-b border-white/10">
          {sections.map(s=>(
            <button key={s.id} onClick={()=>setActive(s.id)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${active===s.id?'bg-white text-black':'bg-white/10'}`}>{s.icon} {s.title}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-[640px] mx-auto">
            <div className={`h-32 rounded-[28px] bg-gradient-to-br ${cur.color} p-6 flex items-end relative overflow-hidden mb-6`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
              <div className="relative">
                <div className="text-4xl">{cur.icon}</div>
                <div className="text-2xl font-black mt-1">{cur.title}</div>
              </div>
              <div className="absolute right-6 top-6 text-6xl opacity-20">{cur.icon}</div>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-[24px] p-6">
              <div dangerouslySetInnerHTML={{__html: cur.content}} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-xs opacity-50">当前模型</div>
                <div className="font-mono text-sm mt-1">qwen2.5-coder:7b</div>
                <div className="text-[10px] opacity-40 mt-1">.env.local 可切换</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-xs opacity-50">运行端口</div>
                <div className="font-mono text-sm mt-1">:30141</div>
                <div className="text-[10px] opacity-40 mt-1">npm run dev -p 30141</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <a href="/" className="inline-block bg-white text-black font-bold rounded-full px-6 py-3 text-sm hover:scale-105 transition">开始对话 →</a>
              <div className="text-[10px] opacity-30 mt-3">my-pi-web v1.0 • 本地 AI • MIT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
