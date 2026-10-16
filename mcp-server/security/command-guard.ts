
/**
 * PR-2.2 Security Core - Command Guard - FIXED
 * Fixes audit: binary whitelist not enough, need action-level whitelist
 * Default: disabled, fail-closed
 */

import path from "path";

export interface CommandDecision {
  decision: "ALLOW" | "REVIEW" | "DENY";
  bypassable: boolean;
  reason: string;
}

const ENABLE_RUN_COMMAND = process.env.MCP_ENABLE_RUN_COMMAND === "true";

// Action-level whitelist - not just binary, but binary + allowed subcommands
const ACTION_WHITELIST: Record<string, string[][]> = {
  git: [
    ["status"],
    ["log", "--oneline"],
    ["log"],
    ["diff", "--stat"],
    ["diff"],
    ["branch", "--list"],
    ["branch"],
    ["remote", "-v"],
    ["remote"],
    ["rev-parse", "--abbrev-ref", "HEAD"],
  ],
  node: [
    ["--version"],
    ["-v"],
  ],
  npm: [
    ["--version"],
    ["-v"],
    ["list", "--depth=0"],
  ],
  ls: [
    [], // ls with no args or safe args validated separately
  ],
  cat: [
    [], // cat file content - but path validated by path-guard
  ],
};

const DANGEROUS_PATTERNS = [
  /;/, /\|\|/, /&&/, /\|/, /`/, /\$\(/, />/, /</, /\n/, /\r/,
  /rm\s+-rf/, /sudo/, /chmod\s+777/, /chown/,
  /curl.*\|.*sh/, /wget.*\|.*sh/,
  /:(){ :|:& };:/, // fork bomb
];

export function evaluateCommand(binary: string, args: string[]): CommandDecision {
  if (!ENABLE_RUN_COMMAND) {
    return { decision: "DENY", bypassable: false, reason: "COMMAND_DISABLED: Set MCP_ENABLE_RUN_COMMAND=true to enable with action whitelist" };
  }

  const base = path.basename(binary.trim());
  const whitelist = ACTION_WHITELIST[base];

  if (!whitelist) {
    return { decision: "DENY", bypassable: false, reason: `BINARY_NOT_ALLOWED: ${base} not in action whitelist [${Object.keys(ACTION_WHITELIST).join(",")}]` };
  }

  const allArgsStr = args.join(" ");
  
  // Check dangerous patterns in args
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(allArgsStr) || pattern.test(binary)) {
      return { decision: "DENY", bypassable: false, reason: `DANGEROUS_PATTERN: ${pattern.source} detected` };
    }
  }

  // Action-level check
  // For tools like ls, cat, we allow but path must be validated elsewhere
  if (["ls", "cat"].includes(base)) {
    // Still check for dangerous args
    if (args.some(a => a.includes("..") || a.startsWith("/") || a.includes("\0"))) {
      return { decision: "DENY", bypassable: false, reason: `SUSPICIOUS_PATH_ARG: ${allArgsStr}` };
    }
    return { decision: "ALLOW", bypassable: true, reason: `ALLOW: ${base} with safe args` };
  }

  // For git, npm, node - check action whitelist
  const isAllowedAction = whitelist.some(allowed => {
    if (allowed.length === 0) return args.length === 0;
    if (allowed.length > args.length) return false;
    // Check prefix match for allowed action
    for (let i = 0; i < allowed.length; i++) {
      if (args[i] !== allowed[i]) return false;
    }
    return true;
  });

  if (!isAllowedAction) {
    return { 
      decision: "DENY", 
      bypassable: false, 
      reason: `ACTION_NOT_ALLOWED: ${base} ${allArgsStr} not in allowed actions for ${base}. Allowed: ${whitelist.map(a => a.join(" ")).join(", ")}` 
    };
  }

  // High-risk actions need approval even if in whitelist
  const highRiskActions = [
    "npm install",
    "npm ci",
    "git push",
    "git pull",
    "git checkout",
  ];

  if (highRiskActions.some(ra => allArgsStr.startsWith(ra.split(" ").slice(1).join(" ")) && base === ra.split(" ")[0])) {
    return { decision: "REVIEW", bypassable: false, reason: `NEEDS_APPROVAL: ${base} ${allArgsStr} is high-risk` };
  }

  return { decision: "ALLOW", bypassable: true, reason: `ALLOW: ${base} ${allArgsStr} in action whitelist` };
}

export function getWhitelist(): string[] {
  return Object.keys(ACTION_WHITELIST);
}
