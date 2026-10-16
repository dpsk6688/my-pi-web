import { NextResponse } from "next/server";
import { startRpcSession, getSessionWrapper, forkSession } from "@/lib/rpc-manager";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = getSessionWrapper(id);
  return NextResponse.json({ id, isStreaming: w?.isStreaming || false, exists: !!w });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message, cwd, action } = await req.json();
  
  if (action === "fork") {
    const newId = forkSession(id);
    return NextResponse.json({ ok: true, newId });
  }

  const wrapper = await startRpcSession(id, cwd || process.cwd());
  wrapper.isStreaming = true;
  wrapper.lastActive = Date.now();

  (async () => {
    try {
      await wrapper.session.prompt(message, (event: any) => {
        const g = globalThis as any;
        g.__piEventBus = g.__piEventBus || new Map();
        const cbs = g.__piEventBus.get(id);
        if (cbs) cbs.forEach((cb: any) => cb(event));
      });
    } finally {
      wrapper.isStreaming = false;
      const g = globalThis as any;
      const cbs = g.__piEventBus?.get(id);
      if (cbs) cbs.forEach((cb: any) => cb({ type: "done" }));
    }
  })();

  return NextResponse.json({ ok: true });
}
