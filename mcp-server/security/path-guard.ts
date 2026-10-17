
/**
 * P0-1 FIX: Unified Path Guard - mcp-server/security/path-guard.ts
 * Replace startsWith with path.relative
 * task-core.ts must DELETE its own resolveAndValidatePath and import this
 */
import path from "path";
import { realpathSync } from "fs";
export class PathGuardError extends Error { constructor(m){super(m); this.name="PATH_TRAVERSAL";} }
export class PathGuard {
  realRoot: string;
  constructor(rootDir: string) {
    const root = path.resolve(rootDir);
    try { this.realRoot = realpathSync(root); } catch { this.realRoot = root; }
  }
  isSameOrSubPath(target: string): boolean {
    const resolved = path.resolve(this.realRoot, target);
    let realTarget: string;
    try { realTarget = realpathSync(resolved); }
    catch {
      try {
        const rp = realpathSync(path.dirname(resolved));
        const rel = path.relative(this.realRoot, rp);
        if (rel.startsWith("..") || path.isAbsolute(rel)) { if (rp !== this.realRoot) return false; }
        return true;
      } catch { return false; }
    }
    const rel = path.relative(this.realRoot, realTarget);
    if (rel === "") return true;
    return !(rel.startsWith("..") || path.isAbsolute(rel));
  }
  resolveAndValidate(unsafe: string): string {
    if (unsafe.includes("\0")) throw new PathGuardError("Null byte");
    const resolved = path.resolve(this.realRoot, unsafe);
    if (!this.isSameOrSubPath(resolved)) throw new PathGuardError("Traversal "+unsafe);
    return resolved;
  }
}
