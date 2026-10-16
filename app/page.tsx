'use client';
import Link from "next/link";
const cards = [
  { href: "/chat", icon: "💬", title: "对话", desc: "AI 编程助手 v1.3", color: "from-zinc-800 to-zinc-900" },
  { href: "/login", icon: "🔐", title: "登录", desc: "渐变玻璃 v1.3 新", color: "from-violet-600 to-fuchsia-500" },
  { href: "/calc", icon: "🧮", title: "计算器", desc: "渐变玻璃 + 动画", color: "from-violet-600 to-cyan-400" },
  { href: "/todo", icon: "✅", title: "待办", desc: "本地存储", color: "from-emerald-400 to-blue-600" },
  { href: "/weather", icon: "⛅", title: "天气", desc: "5天预报 mock", color: "from-sky-500 to-violet-600" },
  { href: "/manual", icon: "📖", title: "手册", desc: "v1.3 操作指南", color: "from-fuchsia-500 to-orange-400" },
];
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-[1000px] mx-auto p-6">
        <div className="mt-8 mb-10">
          <div className="inline-flex gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-full bg-white/10 text-xs tracking-widest">MY-PI-WEB v1.3 • 本地离线 • OLLAMA 7B</div>
            <div className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold">💬 对话已恢复</div>
          </div>
          <h1 className="text-5xl font-black tracking-tight mt-4">本地 AI<br/>编程助手</h1>
          <p className="opacity-60 mt-3 max-w-[500px]">完全离线的 pi / Claude Code 复刻版。Ollama 本地运行，不花钱，不上传代码。支持 write_file + run_command + 项目上下文 + 文件预览跳转。</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c=>(
            <Link key={c.href} href={c.href} className={`rounded-[24px] p-5 bg-gradient-to-br ${c.color} relative overflow-hidden group hover:scale-[1.02] transition`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)] opacity-60" />
              <div className="relative"><div className="text-3xl">{c.icon}</div><div className="font-bold mt-2">{c.title}</div><div className="text-xs opacity-80 mt-1">{c.desc}</div><div className="text-[10px] opacity-60 mt-3 font-mono">{c.href}</div></div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12 opacity-30 text-[11px]">my-pi-web v1.3 • <a href="/chat" className="underline font-bold">去对话 💬</a> • <a href="/login" className="underline">去登录 🔐</a></div>
      </div>
    </div>
  );
}
