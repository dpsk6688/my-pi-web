# my-pi-web v1.1 - 本地离线版 pi

> 完全离线运行的 Claude Code / pi 复刻版，使用 Ollama 本地模型，不花钱、不上传代码。

## ✨ v1.1 特性

- ✅ **三栏复刻 pi UI**: 会话侧边栏 + 对话 + 文件浏览器
- ✅ **Ollama 本地模型**: 默认 qwen2.5-coder:7b，支持 1.5b/7b/14b 切换
- ✅ **真实工具调用**: list_files / read_file / write_file 真实读写硬盘
- ✅ **流式 SSE**: 打字机效果 + toolCall 可视化
- ✅ **内置 3 个炫酷页面**: /calc /todo /weather 渐变+玻璃拟态+动画
- ✅ **Next.js 15 兼容**: 已修复 params await 问题

## 🚀 一键启动

### Windows / Mac / Linux

```bash
# 1. 安装 Ollama https://ollama.com
# 2. 拉模型
ollama pull qwen2.5-coder:7b

# 3. 解压本项目
cd my-pi-web-mvp
npm install --registry=https://registry.npmmirror.com

# 4. 启动
./start.bat   # Windows 双击
# 或
./start.sh    # Mac/Linux: chmod +x start.sh && ./start.sh
```

启动后打开 http://localhost:30141

### 手动启动

```bash
ollama serve  # 另开终端
ollama pull qwen2.5-coder:7b

echo "OLLAMA_MODEL=qwen2.5-coder:7b" > .env.local
echo "OLLAMA_HOST=http://127.0.0.1:11434" >> .env.local
npm run dev
```

## 💬 使用技巧

> 小模型 7b 需要加咒语才会稳定调工具

每次创建文件务必加：
```
必须调用 write_file 工具
```

示例：
```
创建一个炫酷的登录页面到 app/login/page.tsx，要有渐变背景和动画，必须调用 write_file 工具
```

## 📁 目录

- app/api/agent/[id]/events/route.ts - Ollama 流式代理
- lib/local-agent.ts - 核心 Agent + 工具执行
- hooks/useAgentSession.ts - 前端流式 hook
- app/calc/page.tsx - 计算器示例
- app/todo/page.tsx - 待办示例
- app/weather/page.tsx - 天气卡片示例

## 🔧 切换模型

.env.local 里改：

```
OLLAMA_MODEL=qwen2.5-coder:14b  # 更聪明但更慢
OLLAMA_MODEL=qwen2.5-coder:1.5b  # 最快，适合测试
OLLAMA_MODEL=deepseek-coder:6.7b
```

## 🐛 常见问题

- `params should be awaited` -> 已在 v1.1 修复
- 一直 mock 响应 -> 清浏览器缓存 Ctrl+Shift+R
- Ollama 连接失败 -> 确认 ollama serve 在跑，端口 11434

## License MIT
Made with ❤️ for local AI


## v1.1 更新
- 新增 run_command 工具，可执行 shell 命令验证
- 自动读取项目上下文（现有页面）
- 支持多轮工具调用循环（write -> build -> fix）
- 首页导航到所有示例页面
- 危险命令拦截
