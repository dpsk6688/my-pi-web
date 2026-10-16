import fs from "fs";
import path from "path";
import os from "os";

export function getAgentDir() {
  return process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), ".pi", "agent");
}

export function listSessionFiles() {
  const base = path.join(getAgentDir(), "sessions");
  if (!fs.existsSync(base)) return [];
  const files: any[] = [];
  for (const enc of fs.readdirSync(base)) {
    const dir = path.join(base, enc);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".jsonl")) continue;
      files.push({ id: f.replace(".jsonl",""), filePath: path.join(dir, f), encodedCwd: enc, cwd: Buffer.from(enc, "base64").toString().replace(/\x00/g,"") });
    }
  }
  return files.sort((a,b)=> b.id.localeCompare(a.id)).slice(0,100);
}

export function readSessionFile(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

export function normalizeToolCalls(block: any) {
  if (!block) return block;
  if (block.type === "toolCall") {
    return { toolCallId: block.id || block.toolCallId, toolName: block.name || block.toolName, input: block.arguments || block.input };
  }
  return block;
}
