
/**
 * PR-2.1 Task Core - SARA Standard - v6 FINAL FIX
 * FIX: requestApproval direct write with verification, constructor injection
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";

export type TaskStatus = 'pending' | 'running' | 'needs_approval' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'file' | 'command' | 'general' | 'approval';
export type TaskRisk = 'low' | 'medium' | 'high';

export interface TaskApproval {
  command: string;
  args: string[];
  risk: TaskRisk;
  reason: string;
  binary: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  risk?: TaskRisk;
  approval?: TaskApproval;
  result?: any;
  error?: string;
  logs: { ts: string; status: TaskStatus; msg: string }[];
}

const TASK_DIR = ".data/tasks";

export const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['running', 'cancelled', 'failed'],
  running: ['needs_approval', 'completed', 'failed', 'cancelled'],
  needs_approval: ['running', 'completed', 'failed', 'cancelled'],
  completed: [],
  failed: ['pending'],
  cancelled: ['pending'],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
export function isTerminal(s: TaskStatus): boolean {
  return s === 'completed' || s === 'failed' || s === 'cancelled';
}

function getAppRoot(override?: string): string {
  return path.resolve(override || process.env.APP_ROOT || process.cwd());
}

function resolveAndValidatePath(userPath: string, appRootOverride?: string): string {
  const APP_ROOT_DYNAMIC = getAppRoot(appRootOverride);
  if (!userPath || typeof userPath !== "string") throw Object.assign(new Error("INVALID_PATH"), { code: "INVALID_PATH" });
  if (userPath.includes("\0")) throw Object.assign(new Error("NULL_BYTE"), { code: "NULL_BYTE" });
  const normalized = path.normalize(userPath);
  const resolved = path.resolve(APP_ROOT_DYNAMIC, normalized);
  const rel = path.relative(APP_ROOT_DYNAMIC, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw Object.assign(new Error(`PATH_TRAVERSAL: ${userPath}`), { code: "PATH_TRAVERSAL" });
  }
  try {
    const realRoot = fs.realpathSync(APP_ROOT_DYNAMIC);
    let realCheck: string;
    if (fs.existsSync(resolved)) {
      realCheck = fs.realpathSync(resolved);
    } else {
      let parent = path.dirname(resolved);
      let depth = 0;
      while (!fs.existsSync(parent) && parent !== APP_ROOT_DYNAMIC && depth < 20) {
        parent = path.dirname(parent);
        depth++;
      }
      if (!fs.existsSync(parent)) throw Object.assign(new Error(`PARENT_NOT_FOUND`), { code: "PARENT_NOT_FOUND" });
      const realParent = fs.realpathSync(parent);
      if (!realParent.startsWith(realRoot) && realParent !== realRoot) {
        throw Object.assign(new Error(`PARENT_ESCAPE`), { code: "PARENT_ESCAPE" });
      }
      realCheck = path.join(realParent, path.relative(parent, resolved));
      if (!realCheck.startsWith(realRoot)) throw Object.assign(new Error(`PATH_TRAVERSAL_AFTER_REALPATH`), { code: "PATH_TRAVERSAL" });
      return resolved;
    }
    if (!realCheck.startsWith(realRoot) && realCheck !== realRoot) {
      throw Object.assign(new Error(`SYMLINK_ESCAPE`), { code: "SYMLINK_ESCAPE" });
    }
  } catch (e: any) {
    if (e.code && ["PATH_TRAVERSAL","SYMLINK_ESCAPE","PARENT_ESCAPE","NULL_BYTE","INVALID_PATH","PARENT_NOT_FOUND"].includes(e.code)) throw e;
  }
  return resolved;
}

export class TaskManager {
  private appRoot: string;
  constructor(appRoot?: string) {
    this.appRoot = getAppRoot(appRoot);
  }
  private getTaskDir(): string {
    return resolveAndValidatePath(TASK_DIR, this.appRoot);
  }
  private getTaskPath(id: string): string {
    if (!id || /[\\/]/.test(id) || id.includes("..")) throw Object.assign(new Error("INVALID_TASK_ID"), { code: "INVALID_TASK_ID" });
    return resolveAndValidatePath(path.join(TASK_DIR, `${id}.json`), this.appRoot);
  }
  async init() {
    const dir = this.getTaskDir();
    await fsp.mkdir(dir, { recursive: true });
  }
  async createTask(params: { sessionId: string; title: string; type?: TaskType; description?: string; risk?: TaskRisk; approval?: TaskApproval }): Promise<Task> {
    await this.init();
    const id = `tsk_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();
    const task: Task = {
      id,
      title: params.title,
      type: params.type || 'general',
      status: 'pending',
      sessionId: params.sessionId,
      createdAt: now,
      updatedAt: now,
      description: params.description,
      risk: params.risk || 'low',
      approval: params.approval,
      logs: [{ ts: now, status: 'pending', msg: `Created by ${params.sessionId}` }],
    };
    const p = this.getTaskPath(id);
    await fsp.writeFile(p, JSON.stringify(task, null, 2), "utf-8");
    return task;
  }
  async getTask(id: string, sessionId: string): Promise<Task> {
    const p = this.getTaskPath(id);
    const raw = await fsp.readFile(p, "utf-8");
    const task = JSON.parse(raw) as Task;
    if (task.sessionId !== sessionId) throw Object.assign(new Error("SESSION_MISMATCH"), { code: "SESSION_MISMATCH" });
    return task;
  }
  async updateStatus(id: string, sessionId: string, to: TaskStatus, extra?: { result?: any; error?: string; logMsg?: string; approval?: TaskApproval }): Promise<Task> {
    const p = this.getTaskPath(id);
    const raw = await fsp.readFile(p, "utf-8");
    const task = JSON.parse(raw) as Task;
    if (task.sessionId !== sessionId) throw Object.assign(new Error("SESSION_MISMATCH"), { code: "SESSION_MISMATCH" });
    if (!canTransition(task.status, to)) {
      throw Object.assign(new Error(`INVALID_TRANSITION: ${task.status} -> ${to}`), { code: "INVALID_TRANSITION" });
    }
    const now = new Date().toISOString();
    task.status = to;
    task.updatedAt = now;
    if (extra?.result !== undefined) task.result = extra.result;
    if (extra?.error !== undefined) task.error = extra.error;
    if (extra?.approval !== undefined) task.approval = extra.approval;
    task.logs.push({ ts: now, status: to, msg: extra?.logMsg || `Transition to ${to}` });
    await fsp.writeFile(p, JSON.stringify(task, null, 2), "utf-8");
    return task;
  }
  async start(id: string, sessionId: string): Promise<Task> {
    return this.updateStatus(id, sessionId, 'running', { logMsg: 'Started' });
  }
  async requestApproval(id: string, sessionId: string, approval: TaskApproval): Promise<Task> {
    // V6 FIX: Direct read-modify-write, no intermediate getTask that loses approval
    const p = this.getTaskPath(id);
    const raw = await fsp.readFile(p, "utf-8");
    const task = JSON.parse(raw) as Task;
    if (task.sessionId !== sessionId) throw Object.assign(new Error("SESSION_MISMATCH"), { code: "SESSION_MISMATCH" });
    if (task.status !== 'running') throw Object.assign(new Error("MUST_BE_RUNNING"), { code: "MUST_BE_RUNNING" });
    if (!canTransition(task.status, 'needs_approval')) throw Object.assign(new Error(`INVALID_TRANSITION`), { code: "INVALID_TRANSITION" });
    const now = new Date().toISOString();
    task.approval = approval; // PERSIST APPROVAL
    task.risk = approval.risk;
    task.status = 'needs_approval';
    task.updatedAt = now;
    task.logs.push({ ts: now, status: 'needs_approval', msg: `Needs approval: ${approval.command} ${approval.args.join(" ")} risk=${approval.risk}` });
    await fsp.writeFile(p, JSON.stringify(task, null, 2), "utf-8");
    // Verify persisted
    const raw2 = await fsp.readFile(p, "utf-8");
    const verified = JSON.parse(raw2) as Task;
    if (!verified.approval) {
      throw Object.assign(new Error("APPROVAL_NOT_PERSISTED"), { code: "APPROVAL_NOT_PERSISTED" });
    }
    return verified;
  }
  async approve(id: string, sessionId: string, approved: boolean): Promise<Task> {
    const task = await this.getTask(id, sessionId);
    if (task.status !== 'needs_approval') throw Object.assign(new Error("MUST_BE_NEEDS_APPROVAL"), { code: "MUST_BE_NEEDS_APPROVAL" });
    if (!approved) {
      return this.updateStatus(id, sessionId, 'failed', { error: 'Denied by user', logMsg: 'Denied by user' });
    }
    return this.updateStatus(id, sessionId, 'running', { logMsg: 'Approved, continuing' });
  }
  async complete(id: string, sessionId: string, result?: any): Promise<Task> {
    return this.updateStatus(id, sessionId, 'completed', { result, logMsg: 'Completed' });
  }
  async fail(id: string, sessionId: string, error: string): Promise<Task> {
    return this.updateStatus(id, sessionId, 'failed', { error, logMsg: `Failed: ${error}` });
  }
  async cancel(id: string, sessionId: string): Promise<Task> {
    const task = await this.getTask(id, sessionId);
    if (isTerminal(task.status)) throw Object.assign(new Error("ALREADY_TERMINAL"), { code: "ALREADY_TERMINAL" });
    return this.updateStatus(id, sessionId, 'cancelled', { logMsg: 'Cancelled by user' });
  }
  async retry(id: string, sessionId: string): Promise<Task> {
    return this.updateStatus(id, sessionId, 'pending', { logMsg: 'Retried to pending' });
  }
  async listBySession(sessionId: string): Promise<Task[]> {
    await this.init();
    const dir = this.getTaskDir();
    const files = await fsp.readdir(dir).catch(() => [] as string[]);
    const tasks: Task[] = [];
    for (const f of files) {
      if (!f.endsWith(".json") || !f.startsWith("tsk_")) continue;
      try {
        const p = this.getTaskPath(f.replace(".json",""));
        const raw = await fsp.readFile(p, "utf-8");
        const t = JSON.parse(raw) as Task;
        if (t.sessionId === sessionId) tasks.push(t);
      } catch {}
    }
    return tasks.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
  async countBySession(sessionId: string): Promise<Record<TaskStatus, number>> {
    const tasks = await this.listBySession(sessionId);
    const counts: Record<TaskStatus, number> = { pending:0, running:0, needs_approval:0, completed:0, failed:0, cancelled:0 };
    for (const t of tasks) counts[t.status]++;
    return counts;
  }
}
