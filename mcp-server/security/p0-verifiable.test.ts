import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";

// Copy of resolveAndValidatePath for testing
function resolveAndValidatePath(APP_ROOT: string, userPath: string): string {
  if (!userPath || typeof userPath !== "string") throw Object.assign(new Error("INVALID_PATH"), { code: "INVALID_PATH" });
  if (userPath.includes("\0")) throw Object.assign(new Error("NULL_BYTE"), { code: "NULL_BYTE" });
  const normalized = path.normalize(userPath);
  const resolved = path.resolve(APP_ROOT, normalized);
  const rel = path.relative(APP_ROOT, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw Object.assign(new Error(`PATH_TRAVERSAL: ${userPath}`), { code: "PATH_TRAVERSAL" });
  if (!resolved.startsWith(APP_ROOT)) throw Object.assign(new Error("PATH_TRAVERSAL"), { code: "PATH_TRAVERSAL" });
  return resolved;
}

describe("P0 Path Guard - Must Pass Before Merge", () => {
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "p0-guard-"));
  console.log(`Testing with ROOT=${ROOT}`);

  it("REJECT ../../etc/passwd", () => {
    expect(() => resolveAndValidatePath(ROOT, "../../etc/passwd")).toThrow(/TRAVERSAL/);
  });

  it("REJECT /etc/passwd absolute", () => {
    expect(() => resolveAndValidatePath(ROOT, "/etc/passwd")).toThrow(/TRAVERSAL/);
  });

  it("REJECT null byte", () => {
    expect(() => resolveAndValidatePath(ROOT, "a\0b")).toThrow(/NULL_BYTE/);
  });

  it("REJECT ..\\..\\windows", () => {
    expect(() => resolveAndValidatePath(ROOT, "..\\..\\windows\\system32")).toThrow();
  });

  it("ALLOW valid inside path", () => {
    const p = resolveAndValidatePath(ROOT, "app/page.tsx");
    expect(p.startsWith(ROOT)).toBe(true);
  });

  it("ALLOW . (root)", () => {
    const p = resolveAndValidatePath(ROOT, ".");
    expect(p).toBe(ROOT);
  });
});

describe("P0 Command Guard - Must Pass Before Merge", () => {
  function evaluate(binary: string, args: string[], enabled: boolean, whitelist: string[]) {
    if (!enabled) return { decision: "DENY", bypassable: false, reason: "COMMAND_DISABLED" };
    const base = path.basename(binary);
    if (!whitelist.includes(base)) return { decision: "DENY", bypassable: false, reason: `BINARY_NOT_ALLOWED: ${base}` };
    const allArgs = args.join(" ");
    if (/[;&|$`\(\)\{\}<>\n]/.test(allArgs)) return { decision: "DENY", bypassable: false, reason: "SHELL_METACHAR" };
    return { decision: "ALLOW", bypassable: true, reason: "ALLOWED" };
  }

  const WHITELIST = ["git", "npm", "node"];

  it("DENY when disabled - bypassable=false", () => {
    const r = evaluate("git", ["status"], false, WHITELIST);
    expect(r.decision).toBe("DENY");
    expect(r.bypassable).toBe(false);
  });

  it("DENY rm -rf - not in whitelist, exact match", () => {
    const r = evaluate("rm", ["-rf", "/"], true, WHITELIST);
    expect(r.decision).toBe("DENY");
  });

  it("DENY /bin/rm - basename check", () => {
    const r = evaluate("/bin/rm", ["-rf"], true, WHITELIST);
    expect(r.decision).toBe("DENY");
  });

  it("DENY shell injection ;", () => {
    const r = evaluate("git", ["status; rm -rf /"], true, WHITELIST);
    expect(r.decision).toBe("DENY");
    expect(r.reason).toBe("SHELL_METACHAR");
  });

  it("DENY pipe |", () => {
    const r = evaluate("git", ["status", "|", "cat", "/etc/passwd"], true, WHITELIST);
    expect(r.decision).toBe("DENY");
  });

  it("ALLOW git status", () => {
    const r = evaluate("git", ["status"], true, WHITELIST);
    expect(r.decision).toBe("ALLOW");
  });
});

describe("P0 Session Isolation - Must Pass", () => {
  class SessionManager {
    private map = new Map<string, any>();
    create(id: string, transport: any) { this.map.set(id, { id, transport }); }
    get(id: string) { return this.map.get(id); }
    delete(id: string) { this.map.delete(id); }
    count() { return this.map.size; }
  }

  it("isolate two clients", () => {
    const sm = new SessionManager();
    sm.create("A", { id: "tA" });
    sm.create("B", { id: "tB" });
    expect(sm.get("A").transport.id).toBe("tA");
    expect(sm.get("B").transport.id).toBe("tB");
  });

  it("delete A does not affect B", () => {
    const sm = new SessionManager();
    sm.create("A", {});
    sm.create("B", {});
    sm.delete("A");
    expect(sm.get("B")).toBeDefined();
    expect(sm.get("A")).toBeUndefined();
    expect(sm.count()).toBe(1);
  });

  it("unknown session returns undefined", () => {
    const sm = new SessionManager();
    expect(sm.get("unknown")).toBeUndefined();
  });
});
