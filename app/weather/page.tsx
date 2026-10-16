'use client';
import { useState } from "react";

const mock = {
  city: "Shenzhen",
  temp: 28,
  desc: "Partly Cloudy",
  humidity: 72,
  wind: "12 km/h",
  forecast: [
    { day: "Today", icon: "⛅", high: 30, low: 26 },
    { day: "Tue", icon: "🌧️", high: 28, low: 24 },
    { day: "Wed", icon: "🌦️", high: 29, low: 25 },
    { day: "Thu", icon: "☀️", high: 32, low: 27 },
    { day: "Fri", icon: "⛅", high: 31, low: 26 },
  ]
};

export default function WeatherPage() {
  const [unit, setUnit] = useState<'C'|'F'>('C');
  const t = (c:number) => unit==='C'? c : Math.round(c*9/5+32);
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
      <div className="relative w-full max-w-[380px] bg-white/15 backdrop-blur-2xl rounded-[32px] p-6 border border-white/20 shadow-2xl">
        <div className="flex justify-between items-center text-white/80 text-sm">
          <span>📍 {mock.city}</span>
          <button onClick={()=>setUnit(u=>u==='C'?'F':'C')} className="bg-white/20 rounded-full px-3 py-1 backdrop-blur">°{unit}</button>
        </div>
        <div className="text-center mt-6">
          <div className="text-7xl animate-[bounce_3s_infinite]">⛅</div>
          <div className="text-white text-6xl font-thin mt-2">{t(mock.temp)}°</div>
          <div className="text-white/80 mt-1">{mock.desc}</div>
          <div className="flex justify-center gap-4 mt-4 text-white/60 text-xs">
            <span>💧 {mock.humidity}%</span><span>💨 {mock.wind}</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-8">
          {mock.forecast.map(f=>(
            <div key={f.day} className="bg-white/10 rounded-2xl p-2 text-center backdrop-blur">
              <div className="text-white/60 text-[10px]">{f.day}</div>
              <div className="text-xl my-1">{f.icon}</div>
              <div className="text-white text-xs">{t(f.high)}°/{t(f.low)}°</div>
            </div>
          ))}
        </div>
        <div className="text-center text-white/30 text-[10px] mt-6">qwen2.5-coder:7b • mock data • my-pi-web v0.3</div>
      </div>
    </div>
  );
}
