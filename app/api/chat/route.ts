
import { NextRequest, NextResponse } from "next/server";
import { runLocalAgent } from "@/lib/local-agent";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
    const result = await runLocalAgent(message, sessionId || "default");
    // result: { messages: [{content, tool_call, tool_result...}] }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("api/chat error", e);
    return NextResponse.json({ content: "❌ 后端错误: " + (e?.message || String(e)), messages: [{ content: "❌ 后端错误: " + (e?.message || String(e)) }] }, { status: 500 });
  }
}
