# MY-PI-WEB 2.0

> Web UI for Pi Coding Agent + WEB MCP 2.0

[Version](https://img.shields.io/badge/version-v2.0.0-blue)
[MCP](https://img.shields.io/badge/MCP-WEB%20MCP%202.0-green)
[License](https://img.shields.io/badge/license-MIT-lightgrey)

MY-PI-WEB 是一个为 Pi Coding Agent 打造的现代化 Web UI，内置 WEB MCP 2.0 服务器，让你可以用浏览器操作 Pi，同时让任何支持 MCP 的 AI 客户端直接调用。

---

## ✨ 功能特性

- **Web UI** - 浏览器里直接操作 Pi，支持会话管理、文件浏览、实时终端
- **WEB MCP 2.0** - 标准 SSE 协议的 MCP 服务器，可被 Claude Desktop / Cursor / Pi 等客户端调用
- **双服务一键启动** - Web (30141) + MCP (30142) 双端口隔离，互不影响
- **零配置** - `start.bat` 双击即用

---

## 🚀 快速开始

### 1. 克隆 & 安装

```bash
git clone https://github.com/sara-protocol/my-pi-web.git
cd my-pi-web
npm install
```

### 2. 一键启动（Windows）

双击 `start.bat`，会自动打开两个窗口：

- Web UI: http://localhost:30141
- MCP Server: http://localhost:30142/sse

### 3. 手动启动

```bash
# 启动 Web UI (端口 30141)
npm run dev

# 启动 WEB MCP 2.0 (端口 30142)
npm run dev:mcp
```

---

## 🔌 WEB MCP 2.0 接入说明

### 什么是 WEB MCP 2.0？

WEB MCP 2.0 是基于 SSE (Server-Sent Events) 的 MCP (Model Context Protocol) 实现，让 AI 助手可以直接操作你的 Pi 项目。

MCP 端点：

```
http://localhost:30142/sse
```

健康检查：

```bash
curl http://localhost:30142/
# 返回: {"name": "MY-PI-WEB WEB MCP 2.0", "sse": "/sse"}
```

### 接入方式

#### 1) Pi Coding Agent

在你的 Pi 配置文件 `~/.pi/config.json` 或项目 `.pi/settings.json` 中添加：

```json
{
  "mcpServers": {
    "my-pi-web": {
      "url": "http://localhost:30142/sse",
      "transport": "sse"
    }
  }
}
```

#### 2) Claude Desktop

编辑 `claude_desktop_config.json`：

Windows: `%APPDATA%\Claude\claude_desktop_config.json`
Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "my-pi-web": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:30142/sse"]
    }
  }
}
```

> 需要先安装 `mcp-remote`: `npm install -g mcp-remote`

#### 3) Cursor

在 Cursor 的 `Settings > Features > MCP Servers` 添加：

```json
{
  "my-pi-web": {
    "url": "http://localhost:30142/sse"
  }
}
```

#### 4) 公网部署

如果你要部署到服务器，将 localhost 换成你的域名，并确保 30142 端口开放：

```json
{
  "mcpServers": {
    "my-pi-web": {
      "url": "https://your-domain.com:30142/sse"
    }
  }
}
```

建议使用 Nginx 反向代理 + HTTPS：

```nginx
location /sse {
  proxy_pass http://127.0.0.1:30142/sse;
  proxy_set_header Connection "";
  proxy_http_version 1.1;
  proxy_buffering off;
  proxy_cache off;
  proxy_set_header Host $host;
}
```

---

## 🛠️ 可用工具 (MCP Tools)

WEB MCP 2.0 目前暴露以下工具：

| 工具 | 说明 |
|------|------|
| `list_sessions` | 列出所有 Pi 会话 |
| `read_file` | 读取项目文件 |
| `write_file` | 写入项目文件 |
| `run_command` | 执行终端命令 |
| `web_browse` | 浏览器预览 |

> 更多工具持续开发中，欢迎 PR！

---

## 📁 项目结构

```
my-pi-web/
├── app/                # Next.js Web UI
├── components/         # React 组件
├── lib/                # 工具库
├── mcp-server/         # WEB MCP 2.0 服务器 (端口 30142)
│   ├── index.ts        # MCP 入口
│   └── tools/          # MCP 工具定义
├── .github/workflows/  # GitHub Action 自动发布
├── start.bat           # Windows 一键启动
├── start.sh            # Mac/Linux 一键启动
└── package.json
```

---

## 🔧 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev          # Web
npm run dev:mcp      # MCP

# 构建
npm run build
```

---

## 📦 发布

```bash
git tag v2.0.0
git push origin v2.0.0
```

推送 tag 会自动触发 GitHub Action 创建 Release。

---

## 🙏 致谢

- [Pi Coding Agent](https://github.com/badlogic/pi-mono) - 强大的终端编程助手
- [Model Context Protocol](https://modelcontextprotocol.io) - 开放的 MCP 标准

---

## 📄 License

MIT © sara-protocol

**MY-PI-WEB 2.0** - 让 Pi 拥有 Web 灵魂 🚀
