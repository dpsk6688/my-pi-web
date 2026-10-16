import { NextResponse } from "next/server";
import { listFiles, readFileContent, writeFileContent, getRoot } from "@/lib/file-tools";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "list";
  const p = searchParams.get("path") || ".";
  try {
    if (action === "list") {
      return NextResponse.json({ root: getRoot(), files: listFiles(p), path: p });
    } else if (action === "read") {
      return NextResponse.json({ content: readFileContent(p), path: p });
    }
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { path: p, content } = await req.json();
    const res = writeFileContent(p, content);
    return NextResponse.json(res);
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
