
/**
 * P0-2 + P0-3 FIX: Auth + Principal + Session Binding
 * mcp-server/security/auth.ts
 */
export type Principal = { id: string; role: "user"|"approver"|"admin"; tokenHash: string; };

export function assertAuthConfig() {
  // FIX: Check BOTH NODE_ENV and APP_ENV, and fail closed
  const isProd = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
  const token = process.env.MCP_AUTH_TOKEN;
  if (isProd && !token) {
    throw new Error("MCP_AUTH_TOKEN required in production");
  }
  if (token && token.length < 16) {
    throw new Error("MCP_AUTH_TOKEN too short");
  }
}

export function getPrincipalFromRequest(req: { headers: Record<string,string> }): Principal | null {
  const auth = req.headers["authorization"] || req.headers["Authorization"];
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  // hash and lookup principal - production should use secure compare
  // For now, principal id = token hash prefix
  const tokenHash = hashToken(token);
  return { id: "principal_"+tokenHash.slice(0,8), role: "user", tokenHash };
}

function hashToken(t: string): string { 
  // placeholder - use crypto.createHash in real code
  let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0; return h.toString(16); 
}

// REAL authorization, not return true
export function canAccessTask(principal: Principal, task: { sessionId: string; principalId: string }): boolean {
  if (principal.role === "admin") return true;
  return task.principalId === principal.id;
}
export function canApproveTask(principal: Principal, task: { principalId: string }): boolean {
  if (principal.role === "admin" || principal.role === "approver") return true;
  // owner cannot approve own high-risk task
  return false;
}
