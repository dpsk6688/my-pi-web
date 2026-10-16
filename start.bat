@echo off
echo Starting Ollama...
start /B ollama serve
timeout /t 2 >nul
echo Pulling model if needed...
ollama pull qwen2.5-coder:7b
echo.
echo OLLAMA_MODEL=qwen2.5-coder:7b> .env.local
echo OLLAMA_HOST=http://127.0.0.1:11434>> .env.local
echo Starting my-pi-web v1.0...
echo Open http://localhost:30141
npm run dev
