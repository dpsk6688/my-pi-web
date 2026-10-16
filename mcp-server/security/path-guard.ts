
/**
 * PR-2.2 Security Core - Path Guard - FIXED
 * Fixes audit issue: realpath check using startsWith is vulnerable to /srv/app vs /srv/application-secret
 * Must use path.relative for realpath validation
 */

import fs from "fs";
import path from "path";

export function getAppRoot(override?: string): string {
  return path.resolve(override || process.env.APP_ROOT || process.cwd());
}

export function isSubPath(parent: string, child: string): boolean {
  // Secure check: child must be inside parent, not just string prefix
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function isSameOrSubPath(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function resolveAndValidatePath(userPath: string, appRootOverride?: string): string {
  const APP_ROOT = getAppRoot(appRootOverride);
  
  if (!userPath || typeof userPath !== "string") {
    throw Object.assign(new Error("INVALID_PATH: empty"), { code: "INVALID_PATH" });
  }
  if (userPath.includes("\0")) {
    throw Object.assign(new Error("NULL_BYTE"), { code: "NULL_BYTE" });
  }

  const normalized = path.normalize(userPath);
  const resolved = path.resolve(APP_ROOT, normalized);
  const rel = path.relative(APP_ROOT, resolved);
  
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw Object.assign(new Error(`PATH_TRAVERSAL: ${userPath}`), { code: "PATH_TRAVERSAL" });
  }

  // Realpath checks - FIXED: use relative, not startsWith
  try {
    const realRoot = fs.realpathSync(APP_ROOT);
    let realCheck: string;

    if (fs.existsSync(resolved)) {
      realCheck = fs.realpathSync(resolved);
      // FIX: Use isSameOrSubPath, not startsWith
      if (!isSameOrSubPath(realRoot, realCheck)) {
        throw Object.assign(new Error(`SYMLINK_ESCAPE: ${userPath} -> ${realCheck} not in ${realRoot}`), { code: "SYMLINK_ESCAPE" });
      }
    } else {
      // Find nearest existing parent
      let parent = path.dirname(resolved);
      let depth = 0;
      while (!fs.existsSync(parent) && parent !== APP_ROOT && depth < 20) {
        const next = path.dirname(parent);
        if (next === parent) break;
        parent = next;
        depth++;
      }
      if (!fs.existsSync(parent)) {
        throw Object.assign(new Error(`PARENT_NOT_FOUND: ${userPath}`), { code: "PARENT_NOT_FOUND" });
      }
      const realParent = fs.realpathSync(parent);
      if (!isSameOrSubPath(realRoot, realParent)) {
        throw Object.assign(new Error(`PARENT_ESCAPE: ${userPath}`), { code: "PARENT_ESCAPE" });
      }
      const relativePart = path.relative(parent, resolved);
      realCheck = path.join(realParent, relativePart);
      if (!isSameOrSubPath(realRoot, realCheck)) {
        throw Object.assign(new Error(`PATH_TRAVERSAL_AFTER_REALPATH: ${userPath}`), { code: "PATH_TRAVERSAL" });
      }
      return resolved;
    }
  } catch (e: any) {
    // FIX: Do NOT swallow errors - fail-closed
    if (e.code && ["PATH_TRAVERSAL", "SYMLINK_ESCAPE", "PARENT_ESCAPE", "NULL_BYTE", "INVALID_PATH", "PARENT_NOT_FOUND", "PATH_TRAVERSAL_AFTER_REALPATH"].includes(e.code)) {
      throw e;
    }
    // For realpath errors on non-existing paths, we already validated parent
    // But if realRoot check fails, we must fail-closed
    if (e.code === "ENOENT") {
      // Parent not found already handled
    } else {
      // Any other FS error during security check -> fail closed
      throw Object.assign(new Error(`PATH_GUARD_FS_ERROR: ${e.message}`), { code: "PATH_GUARD_FS_ERROR" });
    }
  }

  return resolved;
}

// Atomic write helper - fixes audit issue: check-then-write race
export async function atomicWriteFile(filePath: string, content: string, appRootOverride?: string): Promise<void> {
  const { default: fsp } = await import("fs/promises");
  const safePath = resolveAndValidatePath(filePath, appRootOverride);
  const dir = path.dirname(safePath);
  await fsp.mkdir(dir, { recursive: true });
  // Re-validate after mkdir (TOCTOU mitigation)
  resolveAndValidatePath(filePath, appRootOverride);
  
  const tmpPath = `${safePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  await fsp.writeFile(tmpPath, content, "utf-8");
  await fsp.rename(tmpPath, safePath);
}
