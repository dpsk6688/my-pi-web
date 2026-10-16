import { NextResponse } from "next/server";
import { listSessionFiles, readSessionFile } from "@/lib/session-reader";

export async function GET() {
  try {
    const files = listSessionFiles();
    const withPreview = files.map(f => {
      try {
        const entries = readSessionFile(f.filePath);
        const header = entries.find((e:any)=> e.type==="session");
        return { ...f, name: header?.name || f.id.slice(0,8), model: header?.model, timestamp: header?.timestamp };
      } catch { return { ...f, name: f.id.slice(0,8) }; }
    });
    return NextResponse.json(withPreview);
  } catch (e:any) {
    return NextResponse.json({ error: e.message, mock: [] });
  }
}
