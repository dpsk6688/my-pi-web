'use client';
import { useEffect, useState } from "react";

type FileItem = { name: string; isDir: boolean; size: number; path: string };

export function FileExplorer({ onFileSelect, refreshKey }: { onFileSelect: (path:string, content?:string)=>void, refreshKey?: number }) {
  const [path, setPath] = useState(".");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [root, setRoot] = useState("");
  const [preview, setPreview] = useState<{path:string, content:string} | null>(null);

  async function load(p = path) {
    const res = await fetch(`/api/files?action=list&path=${encodeURIComponent(p)}`);
    const data = await res.json();
    if (data.files) { setFiles(data.files); setPath(data.path); setRoot(data.root); }
  }

  async function openFile(f: FileItem) {
    if (f.isDir) { load(f.path); return; }
    const res = await fetch(`/api/files?action=read&path=${encodeURIComponent(f.path)}`);
    const data = await res.json();
    if (data.content !== undefined) { setPreview({ path: f.path, content: data.content }); onFileSelect(f.path, data.content); }
  }

  useEffect(()=>{ load("."); }, []);
  useEffect(()=>{ if(refreshKey) load(path); }, [refreshKey]);

  return (
    <div className="w-[320px] border-l border-zinc-800 bg-zinc-950 flex flex-col">
      <div className="p-3 text-xs font-bold flex justify-between items-center border-b border-zinc-800">
        <span>📁 {path}</span>
        <button onClick={()=>load(".")} className="bg-zinc-800 px-2 py-1 rounded">刷新</button>
      </div>
      <div className="text-[10px] opacity-40 px-3 py-1 truncate">{root}</div>
      <div className="flex-1 overflow-auto">
        {path !== "." && <div onClick={()=>load(path.split("/").slice(0,-1).join("/") || ".")} className="p-2 px-3 hover:bg-zinc-900 cursor-pointer text-sm">⬆️ .. 返回上级</div>}
        {files.map(f=>(
          <div key={f.path} onClick={()=>openFile(f)} className="p-2 px-3 hover:bg-zinc-900 cursor-pointer flex justify-between text-sm">
            <span className="truncate">{f.isDir ? "📁" : "📄"} {f.name}</span>
            <span className="text-[10px] opacity-40">{f.isDir ? "" : `${f.size}b`}</span>
          </div>
        ))}
      </div>
      {preview && (
        <div className="h-[40%] border-t border-zinc-800 flex flex-col">
          <div className="p-2 text-xs flex justify-between bg-zinc-900"><span className="truncate">{preview.path}</span><button onClick={()=>setPreview(null)} className="opacity-50">✕</button></div>
          <textarea className="flex-1 bg-black text-xs p-2 font-mono outline-none" value={preview.content} onChange={e=>setPreview({ ...preview, content: e.target.value })} />
          <button onClick={async()=>{ await fetch("/api/files", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ path: preview.path, content: preview.content })}); alert("已保存"); load(path); }} className="bg-white text-black text-xs py-2 font-bold">保存</button>
        </div>
      )}
    </div>
  );
}
