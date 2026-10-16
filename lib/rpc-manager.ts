type Wrapper = { id: string; session: any; isStreaming: boolean; lastActive: number; messages: any[]; };

const g = globalThis as any;
g.__piSessions = g.__piSessions || new Map<string, Wrapper>();
g.__piStartLocks = g.__piStartLocks || new Map<string, Promise<Wrapper>>();
g.__piEventBus = g.__piEventBus || new Map<string, Set<any>>();

const SESSIONS: Map<string, Wrapper> = g.__piSessions;
const LOCKS: Map<string, Promise<Wrapper>> = g.__piStartLocks;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export async function startRpcSession(id: string, cwd: string): Promise<Wrapper> {
  if (SESSIONS.has(id)) {
    const w = SESSIONS.get(id)!;
    w.lastActive = Date.now();
    return w;
  }
  if (LOCKS.has(id)) return LOCKS.get(id)!;

  const p = (async () => {
    try {
      // 优先尝试真实 pi SDK
      const mod: any = await import("@earendil-works/pi-coding-agent").catch(()=>null);
      const create = mod?.createAgentSession || mod?.default?.createAgentSession;
      if (create) {
        const session = await create({ cwd, sessionId: id });
        const wrapper: Wrapper = { id, session, isStreaming: false, lastActive: Date.now(), messages: [] };
        SESSIONS.set(id, wrapper);
        scheduleIdleCheck(id);
        return wrapper;
      }
      throw new Error("no pi SDK");
    } catch {
      // 本地无依赖版本
      const localSession = {
        prompt: async (text: string, cb: any) => {
          const { runLocalAgent } = await import("./local-agent");
          await runLocalAgent(text, cb);
        },
        destroy: () => {}
      };
      const wrapper: Wrapper = { id, session: localSession, isStreaming: false, lastActive: Date.now(), messages: [] };
      SESSIONS.set(id, wrapper);
      scheduleIdleCheck(id);
      return wrapper;
    } finally {
      LOCKS.delete(id);
    }
  })();
  LOCKS.set(id, p);
  return p;
}

export function getSessionWrapper(id: string) { return SESSIONS.get(id); }
export function listSessionWrappers() { return [...SESSIONS.values()]; }
export function forkSession(oldId: string) {
  const old = SESSIONS.get(oldId);
  if (!old) return null;
  const newId = crypto.randomUUID();
  const newWrapper: Wrapper = { id: newId, session: old.session, isStreaming: false, lastActive: Date.now(), messages: [...old.messages] };
  SESSIONS.set(newId, newWrapper);
  return newId;
}

function scheduleIdleCheck(id: string) {
  setTimeout(() => {
    const w = SESSIONS.get(id);
    if (!w) return;
    if (Date.now() - w.lastActive > IDLE_TIMEOUT_MS) {
      try { w.session?.destroy?.(); } catch {}
      SESSIONS.delete(id);
    } else {
      scheduleIdleCheck(id);
    }
  }, IDLE_TIMEOUT_MS);
}
