
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

const ROOT = process.cwd();

function safe(p: string) {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT)) throw new Error("非法路径: " + p);
  return abs;
}

export async function executeTool(name: string, args: any) {
  if (name === "list_files") {
    const dir = safe(args.path || "app");
    if (!fs.existsSync(dir)) return `目录不存在: ${args.path}`;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const lines = entries.map(e => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`).join("\n");
    return `📁 ${args.path}:\n${lines || "(空)"}`;
  }
  if (name === "read_file") {
    const file = safe(args.path);
    if (!fs.existsSync(file)) throw new Error(`文件不存在: ${args.path}`);
    const content = fs.readFileSync(file, "utf-8");
    return content.slice(0, 15000) + (content.length > 15000 ? "\n...截断" : "");
  }
  if (name === "write_file") {
    const file = safe(args.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, args.content, "utf-8");
    return `✅ 已写入 ${args.path} (${args.content.length} 字符)`;
  }
  if (name === "run_command") {
    const { stdout, stderr } = await execAsync(args.command, { cwd: ROOT, timeout: 30000 });
    return `⚡ ${args.command}\nSTDOUT:\n${stdout.slice(0,8000)}\nSTDERR:\n${stderr.slice(0,8000)}`.trim();
  }
  throw new Error(`未知工具: ${name}`);
}
