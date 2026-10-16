'use client';
import { useState } from "react";

export default function CalcPage() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [wow, setWow] = useState(false);

  const inputNum = (n: string) => {
    setDisplay(d => (d === "0" ? n : d + n));
    setWow(true); setTimeout(()=>setWow(false),150);
  };
  const inputDot = () => { if(!display.includes(".")) setDisplay(d=>d+"."); };
  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); };
  const calc = () => {
    if (!prev || !op) return;
    const a = parseFloat(prev), b = parseFloat(display);
    let r = 0;
    if (op === "+") r = a + b;
    if (op === "-") r = a - b;
    if (op === "×") r = a * b;
    if (op === "÷") r = b!==0 ? a / b : 0;
    setDisplay(String(Math.round(r*1e8)/1e8));
    setPrev(null); setOp(null);
  };
  const chooseOp = (o: string) => {
    if (prev && op) calc();
    setPrev(display); setOp(o); setDisplay("0");
  };

  const btn = "h-16 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-lg backdrop-blur";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-400 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent_60%)]" />
      <div className={`relative w-full max-w-[340px] bg-white/10 backdrop-blur-2xl rounded-[32px] p-5 shadow-2xl border border-white/20 transition-transform ${wow ? 'scale-[1.02]' : ''}`}>
        <div className="text-white/60 text-xs tracking-widest mb-2 px-2">MY-PI-WEB • CALC</div>
        <div className="bg-black/30 rounded-2xl p-4 mb-4 text-right overflow-hidden">
          <div className="text-white/50 text-sm h-5 truncate">{prev ? `${prev} ${op||''}` : ''}</div>
          <div className="text-white text-4xl font-light tracking-tight truncate animate-[pulse_0.15s]">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <button onClick={clear} className={`${btn} bg-white/20 text-white col-span-2`}>AC</button>
          <button onClick={()=>setDisplay(d=>d.length>1?d.slice(0,-1):"0")} className={`${btn} bg-white/20 text-white`}>⌫</button>
          <button onClick={()=>chooseOp("÷")} className={`${btn} bg-white text-violet-700`}>÷</button>
          
          {["7","8","9"].map(n=><button key={n} onClick={()=>inputNum(n)} className={`${btn} bg-white/90 text-zinc-900`}>{n}</button>)}
          <button onClick={()=>chooseOp("×")} className={`${btn} bg-white text-violet-700`}>×</button>
          {["4","5","6"].map(n=><button key={n} onClick={()=>inputNum(n)} className={`${btn} bg-white/90 text-zinc-900`}>{n}</button>)}
          <button onClick={()=>chooseOp("-")} className={`${btn} bg-white text-violet-700`}>-</button>
          {["1","2","3"].map(n=><button key={n} onClick={()=>inputNum(n)} className={`${btn} bg-white/90 text-zinc-900`}>{n}</button>)}
          <button onClick={()=>chooseOp("+")} className={`${btn} bg-white text-violet-700`}>+</button>
          <button onClick={()=>inputNum("0")} className={`${btn} bg-white/90 text-zinc-900 col-span-2`}>0</button>
          <button onClick={inputDot} className={`${btn} bg-white/90 text-zinc-900`}>.</button>
          <button onClick={calc} className={`${btn} bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-fuchsia-500/30` }>=</button>
        </div>
        <div className="text-center text-white/40 text-[10px] mt-4">qwen2.5-coder:7b • 本地运行 • my-pi-web v0.3</div>
      </div>
    </div>
  );
}
