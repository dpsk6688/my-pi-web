@echo off
echo Starting MY-PI-WEB 2.0 (Web + MCP)...
start "MY-PI-WEB Web" cmd /k npm run dev
start "MY-PI-WEB MCP" cmd /k npm run dev:mcp
echo.
echo ? Web: http://localhost:30141
echo ? MCP: http://localhost:30142/sse
pause
